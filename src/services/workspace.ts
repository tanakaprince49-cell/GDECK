import {
  DriveFile,
  DriveStorageQuota,
  GmailMessageItem,
  CalendarEvent,
  TaskList,
  TaskItem,
  ChatSpace,
  ChatMessage,
  ContactPerson,
  MeetSpace,
  FormDetails,
  FormResponse,
  SheetMetadata,
} from '../types/workspace';

// Helper for API fetch with standard Google error handling
async function googleFetch(url: string, token: string, options: RequestInit = {}) {
  if (!token) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gdeck_auth_expired', { detail: { message: 'Missing access token' } }));
    }
    throw new Error('Google Workspace session missing or expired. Please click "Reconnect Account".');
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  try {
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      let errorMsg = `Google API Error (${res.status} ${res.statusText})`;
      try {
        const errJson = await res.json();
        if (errJson?.error?.message) {
          errorMsg = errJson.error.message;
        }
      } catch {
        // ignore
      }

      // Check for 401 or invalid credential errors
      if (
        res.status === 401 ||
        errorMsg.includes('invalid authentication credentials') ||
        errorMsg.includes('UNAUTHENTICATED') ||
        errorMsg.includes('OAuth 2 access token')
      ) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('gdeck_auth_expired', {
              detail: { message: 'Your Google session has expired. Click Reconnect to refresh credentials.' },
            })
          );
        }
        throw new Error('Your Google Workspace access token expired. Please click "Reconnect Account" above.');
      }

      throw new Error(errorMsg);
    }
    if (res.status === 204) return null;
    return res.json();
  } catch (err: any) {
    // If a network or CORS error occurs with a subdomain, try fallback to www.googleapis.com
    if (err.name === 'TypeError' && err.message?.includes('fetch') && url.includes('calendar.googleapis.com')) {
      const fallbackUrl = url.replace('https://calendar.googleapis.com', 'https://www.googleapis.com');
      try {
        const res2 = await fetch(fallbackUrl, { ...options, headers });
        if (res2.ok) {
          if (res2.status === 204) return null;
          return res2.json();
        }
      } catch {
        // ignore fallback failure
      }
    }
    throw err;
  }
}

export async function searchDocs(token: string): Promise<DriveFile[]> {
  const q = "mimeType = 'application/vnd.google-apps.document' and trashed = false";
  const url = `https://www.googleapis.com/drive/v3/files?pageSize=30&supportsAllDrives=true&includeItemsFromAllDrives=true&q=${encodeURIComponent(
    q
  )}&fields=files(id,name,modifiedTime,webViewLink,iconLink,thumbnailLink)&orderBy=modifiedTime desc`;
  const data = await googleFetch(url, token);
  return data?.files || [];
}

export async function getDocHtml(token: string, fileId: string): Promise<string> {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/html`;
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      return await res.text();
    }
  } catch (err) {
    console.warn('Error fetching doc HTML:', err);
  }
  try {
    const fallback = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (fallback.ok) {
      return await fallback.text();
    }
  } catch {}
  return '';
}

export async function searchSlides(token: string): Promise<DriveFile[]> {
  const q = "mimeType = 'application/vnd.google-apps.presentation' and trashed = false";
  const url = `https://www.googleapis.com/drive/v3/files?pageSize=30&supportsAllDrives=true&includeItemsFromAllDrives=true&q=${encodeURIComponent(
    q
  )}&fields=files(id,name,modifiedTime,webViewLink,iconLink,thumbnailLink)&orderBy=modifiedTime desc`;
  const data = await googleFetch(url, token);
  return data?.files || [];
}

export async function searchDrawings(token: string): Promise<DriveFile[]> {
  const q = "mimeType = 'application/vnd.google-apps.drawing' and trashed = false";
  const url = `https://www.googleapis.com/drive/v3/files?pageSize=30&supportsAllDrives=true&includeItemsFromAllDrives=true&q=${encodeURIComponent(
    q
  )}&fields=files(id,name,modifiedTime,webViewLink,iconLink,thumbnailLink)&orderBy=modifiedTime desc`;
  const data = await googleFetch(url, token);
  return data?.files || [];
}

export async function searchSites(token: string): Promise<DriveFile[]> {
  const q = "mimeType = 'application/vnd.google-apps.site' and trashed = false";
  const url = `https://www.googleapis.com/drive/v3/files?pageSize=30&supportsAllDrives=true&includeItemsFromAllDrives=true&q=${encodeURIComponent(
    q
  )}&fields=files(id,name,modifiedTime,webViewLink,iconLink,thumbnailLink)&orderBy=modifiedTime desc`;
  const data = await googleFetch(url, token);
  return data?.files || [];
}

export async function createDriveFile(
  token: string,
  name: string,
  mimeType: string,
  _content?: string
): Promise<DriveFile> {
  const data = await googleFetch('https://www.googleapis.com/drive/v3/files', token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      mimeType,
    }),
  });
  return data;
}

// ---------------- Google Drive ----------------
export async function listDriveFiles(
  token: string,
  query?: string,
  mimeFilter?: string,
  section: string = 'my-drive'
): Promise<DriveFile[]> {
  let q = 'trashed = false';

  if (section === 'trash') {
    q = 'trashed = true';
  } else if (section === 'starred') {
    q = 'starred = true and trashed = false';
  } else if (section === 'shared') {
    q = 'sharedWithMe = true and trashed = false';
  } else if (section === 'recent') {
    q = 'trashed = false';
  } else {
    // 'my-drive' or default
    q = 'trashed = false';
  }

  if (query) {
    q += ` and name contains '${query.replace(/'/g, "\\'")}'`;
  }

  if (mimeFilter) {
    if (mimeFilter === 'document') {
      q += ` and (mimeType = 'application/vnd.google-apps.document' or mimeType contains 'document' or mimeType contains 'word' or mimeType = 'application/pdf')`;
    } else if (mimeFilter === 'spreadsheet') {
      q += ` and (mimeType = 'application/vnd.google-apps.spreadsheet' or mimeType contains 'spreadsheet' or mimeType contains 'excel')`;
    } else if (mimeFilter === 'presentation') {
      q += ` and (mimeType = 'application/vnd.google-apps.presentation' or mimeType contains 'presentation' or mimeType contains 'powerpoint')`;
    } else if (mimeFilter === 'image') {
      q += ` and (mimeType contains 'image/' or mimeType = 'application/vnd.google-apps.photo')`;
    } else if (mimeFilter === 'folder') {
      q += ` and mimeType = 'application/vnd.google-apps.folder'`;
    } else {
      q += ` and mimeType contains '${mimeFilter}'`;
    }
  }

  let orderBy = 'modifiedTime desc';
  if (section === 'recent') {
    orderBy = 'viewedByMeTime desc, modifiedTime desc';
  } else if (section === 'shared') {
    orderBy = 'sharedWithMeTime desc, modifiedTime desc';
  }

  const url = `https://www.googleapis.com/drive/v3/files?pageSize=60&supportsAllDrives=true&includeItemsFromAllDrives=true&q=${encodeURIComponent(
    q
  )}&fields=nextPageToken,files(id,name,mimeType,modifiedTime,size,webViewLink,webContentLink,iconLink,thumbnailLink,starred,trashed,shared,owners)&orderBy=${encodeURIComponent(
    orderBy
  )}`;

  try {
    const data = await googleFetch(url, token);
    return data?.files || [];
  } catch (err: any) {
    // If complex orderBy fails (e.g. on certain shared queries), fallback without special orderBy
    if (err.message?.includes('orderBy') || err.message?.includes('Invalid')) {
      const fallbackUrl = `https://www.googleapis.com/drive/v3/files?pageSize=60&supportsAllDrives=true&includeItemsFromAllDrives=true&q=${encodeURIComponent(
        q
      )}&fields=nextPageToken,files(id,name,mimeType,modifiedTime,size,webViewLink,webContentLink,iconLink,thumbnailLink,starred,trashed,shared,owners)`;
      const data2 = await googleFetch(fallbackUrl, token);
      return data2?.files || [];
    }
    throw err;
  }
}

export async function uploadDriveFile(
  token: string,
  file: File,
  folderId?: string
): Promise<DriveFile> {
  const boundary = '-------' + Math.random().toString(36).substring(2) + Date.now().toString(36);
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelim = `\r\n--${boundary}--`;

  const metadata: Record<string, any> = {
    name: file.name,
    mimeType: file.type || 'application/octet-stream',
  };
  if (folderId) {
    metadata.parents = [folderId];
  }

  // Construct multipart/related body with JSON metadata part and file content part
  const multipartRequestBody = new Blob(
    [
      `--${boundary}\r\n`,
      'Content-Type: application/json; charset=UTF-8\r\n\r\n',
      JSON.stringify(metadata),
      delimiter,
      `Content-Type: ${file.type || 'application/octet-stream'}\r\n\r\n`,
      file,
      closeDelim,
    ],
    { type: `multipart/related; boundary=${boundary}` }
  );

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id,name,mimeType,modifiedTime,size,webViewLink,webContentLink,iconLink,thumbnailLink,starred,trashed',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    }
  );

  if (!res.ok) {
    let errText = `Upload failed (${res.status} ${res.statusText})`;
    try {
      const errJson = await res.json();
      if (errJson?.error?.message) errText = errJson.error.message;
    } catch {}
    throw new Error(errText);
  }

  return res.json();
}

export async function downloadDriveFile(
  token: string,
  file: DriveFile
): Promise<{ success: boolean; filename: string }> {
  if (file.mimeType === 'application/vnd.google-apps.folder') {
    throw new Error('Folders cannot be downloaded directly. Please select individual files to download.');
  }

  const isGoogleDoc = file.mimeType.startsWith('application/vnd.google-apps.');
  let downloadUrl = '';
  let finalFilename = file.name;

  if (isGoogleDoc) {
    let exportMime = 'application/pdf';
    let ext = '.pdf';

    if (file.mimeType === 'application/vnd.google-apps.document') {
      exportMime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      ext = '.docx';
    } else if (file.mimeType === 'application/vnd.google-apps.spreadsheet') {
      exportMime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      ext = '.xlsx';
    } else if (file.mimeType === 'application/vnd.google-apps.presentation') {
      exportMime = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
      ext = '.pptx';
    } else if (file.mimeType === 'application/vnd.google-apps.drawing') {
      exportMime = 'image/png';
      ext = '.png';
    } else if (file.mimeType === 'application/vnd.google-apps.form') {
      if (file.webViewLink) {
        window.open(file.webViewLink, '_blank');
        return { success: true, filename: file.name };
      }
      throw new Error('Google Forms cannot be exported as a file.');
    }

    if (!finalFilename.toLowerCase().endsWith(ext)) {
      finalFilename += ext;
    }

    downloadUrl = `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=${encodeURIComponent(exportMime)}`;
  } else {
    downloadUrl = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media&supportsAllDrives=true`;
  }

  let res = await fetch(downloadUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  // If export as DOCX/XLSX/PPTX returns error, fallback to PDF
  if (!res.ok && isGoogleDoc && !downloadUrl.includes('application/pdf')) {
    const fallbackUrl = `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=application/pdf`;
    const fallbackRes = await fetch(fallbackUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (fallbackRes.ok) {
      res = fallbackRes;
      finalFilename = file.name.replace(/\.[^/.]+$/, '') + '.pdf';
    }
  }

  if (!res.ok) {
    let errMsg = `Failed to download file (${res.status})`;
    try {
      const errJson = await res.json();
      if (errJson?.error?.message) errMsg = errJson.error.message;
    } catch {}
    throw new Error(errMsg);
  }

  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = finalFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(objectUrl), 2000);

  return { success: true, filename: finalFilename };
}

export async function toggleStarDriveFile(token: string, fileId: string, starred: boolean): Promise<DriveFile> {
  return googleFetch(`https://www.googleapis.com/drive/v3/files/${fileId}?supportsAllDrives=true`, token, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ starred }),
  });
}

export async function trashDriveFile(token: string, fileId: string): Promise<DriveFile> {
  return googleFetch(`https://www.googleapis.com/drive/v3/files/${fileId}?supportsAllDrives=true`, token, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ trashed: true }),
  });
}

export async function restoreDriveFile(token: string, fileId: string): Promise<DriveFile> {
  return googleFetch(`https://www.googleapis.com/drive/v3/files/${fileId}?supportsAllDrives=true`, token, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ trashed: false }),
  });
}

export async function emptyDriveTrash(token: string): Promise<void> {
  await googleFetch('https://www.googleapis.com/drive/v3/files/trash', token, {
    method: 'DELETE',
  });
}

export async function getDriveStorageQuota(token: string): Promise<DriveStorageQuota> {
  try {
    const data = await googleFetch('https://www.googleapis.com/drive/v3/about?fields=storageQuota,user', token);
    return {
      limit: data?.storageQuota?.limit,
      usage: data?.storageQuota?.usage,
      usageInDrive: data?.storageQuota?.usageInDrive,
      usageInDriveTrash: data?.storageQuota?.usageInDriveTrash,
      user: data?.user,
    };
  } catch (err) {
    console.warn('Could not load storage quota:', err);
    return {};
  }
}

export async function createDriveFolder(token: string, name: string): Promise<DriveFile> {
  const url = 'https://www.googleapis.com/drive/v3/files?fields=id,name,mimeType,modifiedTime,webViewLink';
  return googleFetch(url, token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      mimeType: 'application/vnd.google-apps.folder',
    }),
  });
}

export async function renameDriveFile(token: string, fileId: string, newName: string): Promise<DriveFile> {
  return googleFetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, token, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: newName }),
  });
}

export async function createContact(
  token: string,
  contact: { givenName: string; familyName?: string; email?: string; phone?: string }
): Promise<ContactPerson> {
  const body: any = {
    names: [{ givenName: contact.givenName, familyName: contact.familyName || '' }],
  };
  if (contact.email) {
    body.emailAddresses = [{ value: contact.email }];
  }
  if (contact.phone) {
    body.phoneNumbers = [{ value: contact.phone }];
  }
  return googleFetch(
    'https://people.googleapis.com/v1/people:createContact?personFields=names,emailAddresses,phoneNumbers,photos',
    token,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );
}

export async function deleteDriveFile(token: string, fileId: string): Promise<void> {
  await googleFetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, token, {
    method: 'DELETE',
  });
}

// ---------------- Google Sheets ----------------
export async function searchSpreadsheets(token: string): Promise<DriveFile[]> {
  const q = "mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false";
  const url = `https://www.googleapis.com/drive/v3/files?pageSize=20&q=${encodeURIComponent(
    q
  )}&fields=files(id,name,modifiedTime,webViewLink)&orderBy=modifiedTime desc`;
  const data = await googleFetch(url, token);
  return data?.files || [];
}

export async function getSheetMetadata(token: string, spreadsheetId: string): Promise<SheetMetadata> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`;
  return googleFetch(url, token);
}

export async function getSheetValues(
  token: string,
  spreadsheetId: string,
  range: string
): Promise<{ values?: string[][] }> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
    range
  )}`;
  return googleFetch(url, token);
}

export async function appendSheetRow(
  token: string,
  spreadsheetId: string,
  range: string,
  rowValues: string[]
): Promise<any> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
    range
  )}:append?valueInputOption=USER_ENTERED`;
  return googleFetch(url, token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      range,
      majorDimension: 'ROWS',
      values: [rowValues],
    }),
  });
}

// ---------------- Gmail ----------------
function decodeBase64Utf8(base64Str: string): string {
  try {
    const binary = atob(base64Str.replace(/-/g, '+').replace(/_/g, '/'));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  } catch {
    return atob(base64Str.replace(/-/g, '+').replace(/_/g, '/'));
  }
}

export interface OutgoingAttachment {
  name: string;
  type: string;
  size: number;
  base64Data: string;
}

export async function listGmailMessages(
  token: string,
  maxResults = 25,
  q?: string,
  folder: string = 'inbox',
  category?: string
): Promise<GmailMessageItem[]> {
  const queryParts: string[] = [];

  if (folder === 'starred') {
    queryParts.push('is:starred');
  } else if (folder === 'snoozed') {
    queryParts.push('is:important');
  } else if (folder === 'sent') {
    queryParts.push('in:sent');
  } else if (folder === 'drafts') {
    queryParts.push('in:drafts');
  } else if (folder === 'trash') {
    queryParts.push('in:trash');
  } else if (folder === 'all') {
    // All Mail: used by cross-workspace search, which must not miss archived or sent mail.
  } else {
    // inbox
    queryParts.push('in:inbox');
  }

  if (category && category !== 'primary' && folder === 'inbox') {
    queryParts.push(`category:${category}`);
  }

  if (q && q.trim()) {
    queryParts.push(`(${q.trim()})`);
  }

  const finalQuery = queryParts.join(' ');
  let url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}`;
  if (finalQuery) {
    url += `&q=${encodeURIComponent(finalQuery)}`;
  }

  const listData = await googleFetch(url, token);
  if (!listData?.messages || !listData.messages.length) {
    return [];
  }

  // Fetch metadata details in parallel with limit
  const messagePromises = listData.messages.slice(0, maxResults).map(async (item: { id: string }) => {
    try {
      const msg = await googleFetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${item.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Date`,
        token
      );
      const headers = msg.payload?.headers || [];
      const getHeader = (name: string) =>
        headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

      const labelIds = msg.labelIds || [];
      const isStarred = labelIds.includes('STARRED');
      const isUnread = labelIds.includes('UNREAD');

      return {
        id: msg.id,
        threadId: msg.threadId,
        snippet: msg.snippet,
        subject: getHeader('Subject') || '(No Subject)',
        from: getHeader('From'),
        to: getHeader('To'),
        date: getHeader('Date'),
        isStarred,
        isUnread,
        labelIds,
      };
    } catch {
      return { id: item.id, threadId: '', snippet: '' };
    }
  });

  return Promise.all(messagePromises);
}

export async function getGmailMessageDetails(token: string, messageId: string): Promise<GmailMessageItem> {
  const msg = await googleFetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
    token
  );
  const headers = msg.payload?.headers || [];
  const getHeader = (name: string) =>
    headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

  const labelIds = msg.labelIds || [];
  const isStarred = labelIds.includes('STARRED');
  const isUnread = labelIds.includes('UNREAD');

  const attachments: any[] = [];

  // Helper function to extract text, HTML body, and attachments recursively
  const extractBodiesAndAttachments = (payload: any): { plain: string; html: string } => {
    let plain = '';
    let html = '';
    if (!payload) return { plain, html };

    // Check if this part has an attachment
    if (payload.filename && payload.body?.attachmentId) {
      attachments.push({
        attachmentId: payload.body.attachmentId,
        filename: payload.filename,
        mimeType: payload.mimeType || 'application/octet-stream',
        size: payload.body.size || 0,
      });
    } else if (payload.filename && payload.body?.data) {
      attachments.push({
        attachmentId: '',
        filename: payload.filename,
        mimeType: payload.mimeType || 'application/octet-stream',
        size: payload.body.size || 0,
        data: payload.body.data,
      });
    }

    if (payload.body?.data && !payload.filename) {
      try {
        const decoded = decodeBase64Utf8(payload.body.data);
        if (payload.mimeType === 'text/html') {
          html = decoded;
        } else {
          plain = decoded;
        }
      } catch {
        // ignore decode errors
      }
    }

    if (payload.parts && payload.parts.length > 0) {
      for (const part of payload.parts) {
        const sub = extractBodiesAndAttachments(part);
        if (sub.plain && !plain) plain = sub.plain;
        if (sub.html && !html) html = sub.html;
      }
    }

    return { plain, html };
  };

  const { plain, html } = extractBodiesAndAttachments(msg.payload);
  const bodyContent = plain || html || msg.snippet;

  return {
    id: msg.id,
    threadId: msg.threadId,
    snippet: msg.snippet,
    subject: getHeader('Subject') || '(No Subject)',
    from: getHeader('From'),
    to: getHeader('To'),
    date: getHeader('Date'),
    body: bodyContent,
    htmlBody: html || undefined,
    isStarred,
    isUnread,
    labelIds,
    attachments,
    hasAttachments: attachments.length > 0,
  };
}

export async function downloadGmailAttachment(
  token: string,
  messageId: string,
  attachmentId: string,
  filename: string,
  mimeType: string,
  inlineData?: string
): Promise<{ success: boolean; filename: string }> {
  let base64Data = inlineData;

  if (!base64Data && attachmentId) {
    const data = await googleFetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/attachments/${attachmentId}`,
      token
    );
    base64Data = data?.data;
  }

  if (!base64Data) {
    throw new Error('Attachment file data could not be retrieved.');
  }

  const standardBase64 = base64Data.replace(/-/g, '+').replace(/_/g, '/');
  const byteChars = atob(standardBase64);
  const byteNumbers = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    byteNumbers[i] = byteChars.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: mimeType || 'application/octet-stream' });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'attachment';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);

  return { success: true, filename };
}

export async function exportGmailMessageEml(
  token: string,
  messageId: string,
  subject?: string
): Promise<{ success: boolean; filename: string }> {
  const data = await googleFetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=raw`,
    token
  );
  if (!data?.raw) {
    throw new Error('Failed to retrieve raw email message data');
  }

  const rawString = atob(data.raw.replace(/-/g, '+').replace(/_/g, '/'));
  const blob = new Blob([rawString], { type: 'message/rfc822' });
  const filename = `${(subject || 'email').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40)}.eml`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);

  return { success: true, filename };
}

export async function toggleGmailStar(token: string, messageId: string, isCurrentlyStarred: boolean): Promise<void> {
  const addLabelIds = isCurrentlyStarred ? [] : ['STARRED'];
  const removeLabelIds = isCurrentlyStarred ? ['STARRED'] : [];
  await googleFetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`,
    token,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ addLabelIds, removeLabelIds }),
    }
  );
}

export async function markGmailReadStatus(token: string, messageId: string, markRead: boolean): Promise<void> {
  const addLabelIds = markRead ? [] : ['UNREAD'];
  const removeLabelIds = markRead ? ['UNREAD'] : [];
  await googleFetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`,
    token,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ addLabelIds, removeLabelIds }),
    }
  );
}

export async function sendGmailMessage(
  token: string,
  to: string,
  subject: string,
  bodyText: string,
  attachments: OutgoingAttachment[] = []
): Promise<any> {
  const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;

  let message = '';

  if (!attachments || attachments.length === 0) {
    const messageParts = [
      `To: ${to}`,
      'Content-Type: text/plain; charset=utf-8',
      'MIME-Version: 1.0',
      `Subject: ${utf8Subject}`,
      '',
      bodyText,
    ];
    message = messageParts.join('\r\n');
  } else {
    const boundary = `====boundary_${Date.now()}_${Math.random().toString(36).substring(2)}====`;
    const messageParts = [
      `To: ${to}`,
      `Subject: ${utf8Subject}`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/plain; charset="UTF-8"',
      'Content-Transfer-Encoding: 7bit',
      '',
      bodyText,
      '',
    ];

    for (const att of attachments) {
      messageParts.push(
        `--${boundary}`,
        `Content-Type: ${att.type || 'application/octet-stream'}; name="${att.name}"`,
        `Content-Disposition: attachment; filename="${att.name}"`,
        'Content-Transfer-Encoding: base64',
        '',
        att.base64Data,
        ''
      );
    }

    messageParts.push(`--${boundary}--`);
    message = messageParts.join('\r\n');
  }

  const encodedMessage = btoa(unescape(encodeURIComponent(message)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return googleFetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw: encodedMessage }),
  });
}

export async function trashGmailMessage(token: string, messageId: string): Promise<void> {
  await googleFetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/trash`,
    token,
    { method: 'POST' }
  );
}

export async function untrashGmailMessage(token: string, messageId: string): Promise<void> {
  await googleFetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/untrash`,
    token,
    { method: 'POST' }
  );
}

export async function deleteGmailMessagePermanently(token: string, messageId: string): Promise<void> {
  await googleFetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`,
    token,
    { method: 'DELETE' }
  );
}

// ---------------- Google Calendar ----------------
export async function listCalendarEvents(
  token: string,
  options?: { maxResults?: number; timeMin?: string; timeMax?: string } | number
): Promise<CalendarEvent[]> {
  let maxResults = 250;
  let timeMinStr: string;
  let timeMaxStr: string | undefined;

  if (typeof options === 'number') {
    maxResults = Math.max(options, 250);
    const past = new Date();
    past.setFullYear(past.getFullYear() - 2);
    timeMinStr = past.toISOString();
  } else if (options) {
    maxResults = options.maxResults || 250;
    if (options.timeMin) {
      timeMinStr = options.timeMin;
    } else {
      const past = new Date();
      past.setFullYear(past.getFullYear() - 2);
      timeMinStr = past.toISOString();
    }
    timeMaxStr = options.timeMax;
  } else {
    const past = new Date();
    past.setFullYear(past.getFullYear() - 2);
    timeMinStr = past.toISOString();
  }

  let url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(
    timeMinStr
  )}&orderBy=startTime&singleEvents=true&maxResults=${maxResults}`;

  if (timeMaxStr) {
    url += `&timeMax=${encodeURIComponent(timeMaxStr)}`;
  }

  const data = await googleFetch(url, token);
  return data?.items || [];
}

export async function createCalendarEvent(
  token: string,
  event: {
    summary: string;
    description?: string;
    location?: string;
    startDateTime: string;
    endDateTime: string;
    conferenceData?: boolean;
    colorId?: string;
  }
): Promise<CalendarEvent> {
  const url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1';
  const body: any = {
    summary: event.summary,
    description: event.description,
    location: event.location,
    start: { dateTime: new Date(event.startDateTime).toISOString() },
    end: { dateTime: new Date(event.endDateTime).toISOString() },
  };

  if (event.colorId) {
    body.colorId = event.colorId;
  }

  if (event.conferenceData) {
    body.conferenceData = {
      createRequest: {
        requestId: `meet_${Date.now()}_${Math.random().toString(36).substring(2)}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    };
  }

  return googleFetch(url, token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function updateCalendarEvent(
  token: string,
  eventId: string,
  event: {
    summary: string;
    description?: string;
    location?: string;
    startDateTime: string;
    endDateTime: string;
    colorId?: string;
  }
): Promise<CalendarEvent> {
  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`;
  return googleFetch(url, token, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      summary: event.summary,
      description: event.description,
      location: event.location,
      start: { dateTime: new Date(event.startDateTime).toISOString() },
      end: { dateTime: new Date(event.endDateTime).toISOString() },
      colorId: event.colorId,
    }),
  });
}

export async function deleteCalendarEvent(token: string, eventId: string): Promise<void> {
  await googleFetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
    token,
    { method: 'DELETE' }
  );
}

// Format a date to iCalendar format (YYYYMMDDTHHMMSSZ)
function formatIcsDate(isoString?: string): string {
  if (!isoString) {
    const d = new Date();
    return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  }
  const d = new Date(isoString);
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

// Export entire calendar or list of events as RFC 5545 .ics file
export function exportCalendarIcs(events: CalendarEvent[], calendarName = 'Google-Calendar-Export'): { success: boolean; filename: string } {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Google Workspace Client//Google Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${calendarName}`,
  ];

  for (const evt of events) {
    const startIso = evt.start?.dateTime || evt.start?.date;
    const endIso = evt.end?.dateTime || evt.end?.date;
    if (!startIso) continue;

    lines.push(
      'BEGIN:VEVENT',
      `UID:${evt.id}@google.com`,
      `DTSTAMP:${formatIcsDate()}`,
      `DTSTART:${formatIcsDate(startIso)}`,
      `DTEND:${formatIcsDate(endIso || startIso)}`,
      `SUMMARY:${(evt.summary || 'Untitled Event').replace(/\n/g, ' ')}`
    );

    if (evt.description) {
      lines.push(`DESCRIPTION:${evt.description.replace(/\n/g, '\\n')}`);
    }
    if (evt.location) {
      lines.push(`LOCATION:${evt.location.replace(/\n/g, ' ')}`);
    }
    if (evt.htmlLink) {
      lines.push(`URL:${evt.htmlLink}`);
    }
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  const icsContent = lines.join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const filename = `${calendarName.replace(/[^a-zA-Z0-9_-]/g, '_')}.ics`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);

  return { success: true, filename };
}

// Export single event as .ics
export function exportSingleEventIcs(event: CalendarEvent): { success: boolean; filename: string } {
  return exportCalendarIcs([event], (event.summary || 'event').slice(0, 30));
}

// Parse an uploaded .ics file and create events in Google Calendar
export async function importCalendarIcs(token: string, icsText: string): Promise<{ count: number; skipped: number }> {
  // Simple regex parser for VEVENT blocks in RFC 5545 iCalendar format
  const eventBlocks = icsText.split(/BEGIN:VEVENT/i).slice(1);
  let count = 0;
  let skipped = 0;

  for (const block of eventBlocks) {
    const veventContent = block.split(/END:VEVENT/i)[0];
    if (!veventContent) continue;

    const getField = (field: string): string => {
      const match = veventContent.match(new RegExp(`^${field}[^:]*:(.*)$`, 'm'));
      return match ? match[1].trim().replace(/\\n/g, '\n').replace(/\\,/g, ',') : '';
    };

    const summary = getField('SUMMARY') || 'Imported Event';
    const description = getField('DESCRIPTION');
    const location = getField('LOCATION');
    const dtstart = getField('DTSTART');
    const dtend = getField('DTEND');

    // Parse ICS date string (e.g. 20260915T140000Z or 20260915)
    const parseIcsDateString = (str: string): Date | null => {
      if (!str) return null;
      const clean = str.replace(/[^0-9TZ]/g, '');
      if (clean.length === 8) {
        // YYYYMMDD
        const y = parseInt(clean.slice(0, 4), 10);
        const m = parseInt(clean.slice(4, 6), 10) - 1;
        const d = parseInt(clean.slice(6, 8), 10);
        return new Date(y, m, d);
      }
      if (clean.length >= 15) {
        const y = parseInt(clean.slice(0, 4), 10);
        const m = parseInt(clean.slice(4, 6), 10) - 1;
        const d = parseInt(clean.slice(6, 8), 10);
        const h = parseInt(clean.slice(9, 11), 10);
        const min = parseInt(clean.slice(11, 13), 10);
        const s = parseInt(clean.slice(13, 15), 10);
        if (clean.endsWith('Z')) {
          return new Date(Date.UTC(y, m, d, h, min, s));
        }
        return new Date(y, m, d, h, min, s);
      }
      return new Date(str);
    };

    const startDate = parseIcsDateString(dtstart) || new Date();
    const endDate = parseIcsDateString(dtend) || new Date(startDate.getTime() + 60 * 60 * 1000);

    try {
      await createCalendarEvent(token, {
        summary,
        description: description || undefined,
        location: location || undefined,
        startDateTime: startDate.toISOString(),
        endDateTime: endDate.toISOString(),
      });
      count++;
    } catch (err) {
      console.warn('Failed to import event:', summary, err);
      skipped++;
    }
  }

  return { count, skipped };
}

// ---------------- Google Tasks ----------------
export async function listTaskLists(token: string): Promise<TaskList[]> {
  const data = await googleFetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', token);
  return data?.items || [];
}

export async function listTasks(token: string, tasklistId: string): Promise<TaskItem[]> {
  const data = await googleFetch(
    `https://tasks.googleapis.com/tasks/v1/lists/${tasklistId}/tasks?showCompleted=true&showHidden=true`,
    token
  );
  return data?.items || [];
}

export async function createTask(
  token: string,
  tasklistId: string,
  title: string,
  notes?: string,
  due?: string
): Promise<TaskItem> {
  const body: Record<string, any> = { title };
  if (notes) body.notes = notes;
  if (due) body.due = new Date(due).toISOString();

  return googleFetch(`https://tasks.googleapis.com/tasks/v1/lists/${tasklistId}/tasks`, token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function toggleTaskStatus(
  token: string,
  tasklistId: string,
  taskId: string,
  isCompleted: boolean
): Promise<TaskItem> {
  return googleFetch(
    `https://tasks.googleapis.com/tasks/v1/lists/${tasklistId}/tasks/${taskId}`,
    token,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: isCompleted ? 'completed' : 'needsAction',
      }),
    }
  );
}

export async function deleteTask(token: string, tasklistId: string, taskId: string): Promise<void> {
  await googleFetch(
    `https://tasks.googleapis.com/tasks/v1/lists/${tasklistId}/tasks/${taskId}`,
    token,
    { method: 'DELETE' }
  );
}

// ---------------- Google Chat ----------------
export async function listChatSpaces(token: string): Promise<ChatSpace[]> {
  try {
    const data = await googleFetch('https://chat.googleapis.com/v1/spaces', token);
    return data?.spaces || [];
  } catch (err: any) {
    // Some consumer accounts don't have Google Chat Spaces enabled
    console.warn('Google Chat Spaces query notice:', err);
    throw err;
  }
}

export async function listChatMessages(token: string, spaceName: string): Promise<ChatMessage[]> {
  const data = await googleFetch(
    `https://chat.googleapis.com/v1/${spaceName}/messages?pageSize=25`,
    token
  );
  return data?.messages || [];
}

export async function sendChatMessage(
  token: string,
  spaceName: string,
  text: string
): Promise<ChatMessage> {
  return googleFetch(`https://chat.googleapis.com/v1/${spaceName}/messages`, token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
}

export async function createChatSpace(
  token: string,
  displayName: string,
  spaceType: 'SPACE' | 'GROUP_CHAT' = 'SPACE'
): Promise<ChatSpace> {
  return googleFetch('https://chat.googleapis.com/v1/spaces', token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      spaceType,
      displayName,
    }),
  });
}

// ---------------- Google Contacts (People API) ----------------
export async function listContacts(token: string, pageSize = 30): Promise<ContactPerson[]> {
  const data = await googleFetch(
    `https://people.googleapis.com/v1/people/me/connections?pageSize=${pageSize}&personFields=names,emailAddresses,phoneNumbers,photos`,
    token
  );
  return data?.connections || [];
}

// ---------------- Google Meet ----------------
export async function createMeetingSpace(token: string): Promise<MeetSpace> {
  const data = await googleFetch('https://meet.googleapis.com/v2/spaces', token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  return data;
}

// ---------------- Google Forms ----------------
export async function searchForms(token: string): Promise<DriveFile[]> {
  const q = "mimeType = 'application/vnd.google-apps.form' and trashed = false";
  const url = `https://www.googleapis.com/drive/v3/files?pageSize=20&q=${encodeURIComponent(
    q
  )}&fields=files(id,name,modifiedTime,webViewLink)&orderBy=modifiedTime desc`;
  const data = await googleFetch(url, token);
  return data?.files || [];
}

export async function getFormDetails(token: string, formId: string): Promise<FormDetails> {
  return googleFetch(`https://forms.googleapis.com/v1/forms/${formId}`, token);
}

export async function getFormResponses(token: string, formId: string): Promise<FormResponse[]> {
  const data = await googleFetch(`https://forms.googleapis.com/v1/forms/${formId}/responses`, token);
  return data?.responses || [];
}

// ---------------- Google Photos & Drive Images ----------------
export interface WorkspacePhotoItem {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  webViewLink?: string;
  thumbnailLink?: string;
  webContentLink?: string;
  size?: string;
}

export async function searchUserPhotos(token: string): Promise<WorkspacePhotoItem[]> {
  const q = "mimeType contains 'image/' and trashed = false";
  const url = `https://www.googleapis.com/drive/v3/files?pageSize=50&q=${encodeURIComponent(
    q
  )}&fields=files(id,name,mimeType,modifiedTime,webViewLink,thumbnailLink,webContentLink,size)&orderBy=modifiedTime desc`;
  const data = await googleFetch(url, token);
  return data?.files || [];
}

// ---------------- Google Sites ----------------
export async function searchUserSites(token: string): Promise<DriveFile[]> {
  const q = "mimeType = 'application/vnd.google-apps.site' and trashed = false";
  const url = `https://www.googleapis.com/drive/v3/files?pageSize=30&q=${encodeURIComponent(
    q
  )}&fields=files(id,name,modifiedTime,webViewLink,iconLink)&orderBy=modifiedTime desc`;
  const data = await googleFetch(url, token);
  return data?.files || [];
}

