import {
  DriveFile,
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
export async function listDriveFiles(token: string, query?: string, mimeFilter?: string): Promise<DriveFile[]> {
  let q = "trashed = false";
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
  const url = `https://www.googleapis.com/drive/v3/files?pageSize=50&supportsAllDrives=true&includeItemsFromAllDrives=true&q=${encodeURIComponent(
    q
  )}&fields=nextPageToken,files(id,name,mimeType,modifiedTime,size,webViewLink,iconLink,thumbnailLink)&orderBy=modifiedTime desc`;
  const data = await googleFetch(url, token);
  return data?.files || [];
}

export async function uploadDriveFile(
  token: string,
  file: File,
  folderId?: string
): Promise<DriveFile> {
  const metadata: Record<string, any> = {
    name: file.name,
    mimeType: file.type || 'application/octet-stream',
  };
  if (folderId) {
    metadata.parents = [folderId];
  }

  const form = new FormData();
  form.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], { type: 'application/json' })
  );
  form.append('file', file);

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,modifiedTime,size,webViewLink,iconLink,thumbnailLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: form,
    }
  );

  if (!res.ok) {
    let errText = `Upload failed (${res.status})`;
    try {
      const errJson = await res.json();
      if (errJson?.error?.message) errText = errJson.error.message;
    } catch {}
    throw new Error(errText);
  }

  return res.json();
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
export async function listGmailMessages(
  token: string,
  maxResults = 15,
  q?: string
): Promise<GmailMessageItem[]> {
  let url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}`;
  if (q) {
    url += `&q=${encodeURIComponent(q)}`;
  }
  const listData = await googleFetch(url, token);
  if (!listData?.messages || !listData.messages.length) {
    return [];
  }

  // Fetch details in parallel with limit
  const messagePromises = listData.messages.slice(0, maxResults).map(async (item: { id: string }) => {
    try {
      const msg = await googleFetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${item.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Date`,
        token
      );
      const headers = msg.payload?.headers || [];
      const getHeader = (name: string) =>
        headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

      return {
        id: msg.id,
        threadId: msg.threadId,
        snippet: msg.snippet,
        subject: getHeader('Subject') || '(No Subject)',
        from: getHeader('From'),
        to: getHeader('To'),
        date: getHeader('Date'),
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

  // Helper function to extract text and HTML body recursively
  const extractBodies = (payload: any): { plain: string; html: string } => {
    let plain = '';
    let html = '';
    if (!payload) return { plain, html };

    if (payload.body?.data) {
      try {
        const decoded = atob(payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
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
        const sub = extractBodies(part);
        if (sub.plain && !plain) plain = sub.plain;
        if (sub.html && !html) html = sub.html;
      }
    }

    return { plain, html };
  };

  const { plain, html } = extractBodies(msg.payload);
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
  };
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

export async function sendGmailMessage(
  token: string,
  to: string,
  subject: string,
  bodyText: string
): Promise<any> {
  const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
  const messageParts = [
    `To: ${to}`,
    'Content-Type: text/plain; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: ${utf8Subject}`,
    '',
    bodyText,
  ];
  const message = messageParts.join('\r\n');
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

// ---------------- Google Calendar ----------------
export async function listCalendarEvents(token: string, maxResults = 25): Promise<CalendarEvent[]> {
  const now = new Date();
  // list from 1 day ago to 30 days ahead
  now.setDate(now.getDate() - 1);
  const timeMin = now.toISOString();

  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(
    timeMin
  )}&orderBy=startTime&singleEvents=true&maxResults=${maxResults}`;
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
  }
): Promise<CalendarEvent> {
  const url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
  return googleFetch(url, token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      summary: event.summary,
      description: event.description,
      location: event.location,
      start: { dateTime: new Date(event.startDateTime).toISOString() },
      end: { dateTime: new Date(event.endDateTime).toISOString() },
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

