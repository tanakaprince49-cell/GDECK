export interface DocTemplate {
  id: string;
  title: string;
  desc: string;
  category: string;
  htmlContent: string;
}

export const GOOGLE_DOCS_FONTS = [
  'Arial',
  'Roboto',
  'Times New Roman',
  'Georgia',
  'Garamond',
  'Courier New',
  'Comic Sans MS',
  'Verdana',
  'Trebuchet MS',
  'Impact',
  'Merriweather',
  'Montserrat',
  'Playfair Display',
  'Open Sans',
];

export const GOOGLE_COLOR_PALETTE = [
  '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#efefef', '#f3f3f3', '#ffffff',
  '#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff', '#9900ff', '#ff00ff',
  '#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc',
  '#dd7e6b', '#ea9999', '#f9cb9c', '#ffe599', '#b6d7a8', '#a2c4c9', '#a4c2f4', '#9fc5e8', '#b4a7d6', '#d5a6bd',
  '#cc4125', '#e06666', '#f6b26b', '#ffd966', '#93c47d', '#76a5af', '#6d9eeb', '#6fa8dc', '#8e7cc3', '#c27ba0',
  '#a61c1c', '#cc0000', '#e69138', '#f1c232', '#6aa84f', '#45818e', '#3c78d8', '#3d85c6', '#674ea7', '#a64d79',
  '#5b0f00', '#660000', '#783f04', '#7f6000', '#274e13', '#0c343d', '#1155cc', '#0b5394', '#351c75', '#741b47',
];

export const GOOGLE_HIGHLIGHT_PALETTE = [
  'transparent',
  '#ffff00', '#00ff00', '#00ffff', '#ff00ff', '#0000ff', '#ff0000',
  '#fff2cc', '#d9ead3', '#cfe2f3', '#d9d2e9', '#fce5cd', '#f4cccc',
];

export const DOC_TEMPLATES: DocTemplate[] = [
  {
    id: 'blank',
    title: 'Blank document',
    desc: 'Start with an empty page',
    category: 'General',
    htmlContent: '<p>Start typing or press @ to insert components, people, and dates...</p>',
  },
  {
    id: 'project-proposal',
    title: 'Project Proposal',
    desc: 'Professional project overview & timeline',
    category: 'Work',
    htmlContent: `
      <h1 style="font-size: 26pt; font-weight: bold; color: #1a73e8; margin-bottom: 8px;">Project Proposal</h1>
      <p style="font-size: 13pt; color: #5f6368; margin-bottom: 24px;">Cloud Workspace Integration Initiative</p>
      <hr style="border: none; border-top: 1px solid #dadce0; margin: 16px 0;" />
      <h2 style="font-size: 18pt; font-weight: bold; color: #202124; margin-top: 20px;">1. Executive Summary</h2>
      <p>This proposal outlines the strategy to modernize team collaboration through unified Google Workspace workflows. By streamlining document sharing, real-time meetings, and task assignments, team velocity is projected to increase by 35%.</p>
      <h2 style="font-size: 18pt; font-weight: bold; color: #202124; margin-top: 20px;">2. Project Objectives</h2>
      <ul>
        <li>Provide seamless single-pane-of-glass access to Google Docs, Sheets, and Drive.</li>
        <li>Deliver high-fidelity Material Design 3 user experience indistinguishable from Google's native apps.</li>
        <li>Ensure enterprise-grade cloud persistence with automated Drive synchronization.</li>
      </ul>
      <h2 style="font-size: 18pt; font-weight: bold; color: #202124; margin-top: 20px;">3. Timeline & Deliverables</h2>
      <table style="width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 11pt;">
        <thead>
          <tr style="background-color: #f1f3f4; text-align: left;">
            <th style="padding: 10px; border: 1px solid #dadce0;">Phase</th>
            <th style="padding: 10px; border: 1px solid #dadce0;">Milestone</th>
            <th style="padding: 10px; border: 1px solid #dadce0;">Target Date</th>
            <th style="padding: 10px; border: 1px solid #dadce0;">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 10px; border: 1px solid #dadce0;">Phase 1</td>
            <td style="padding: 10px; border: 1px solid #dadce0;">OAuth 2.0 & Workspace APIs</td>
            <td style="padding: 10px; border: 1px solid #dadce0;">Q1 2026</td>
            <td style="padding: 10px; border: 1px solid #dadce0; color: #188038; font-weight: bold;">Completed</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #dadce0;">Phase 2</td>
            <td style="padding: 10px; border: 1px solid #dadce0;">Interactive Document & Sheet Editors</td>
            <td style="padding: 10px; border: 1px solid #dadce0;">Q2 2026</td>
            <td style="padding: 10px; border: 1px solid #dadce0; color: #1a73e8; font-weight: bold;">Active</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #dadce0;">Phase 3</td>
            <td style="padding: 10px; border: 1px solid #dadce0;">Full Enterprise Rollout</td>
            <td style="padding: 10px; border: 1px solid #dadce0;">Q3 2026</td>
            <td style="padding: 10px; border: 1px solid #dadce0; color: #5f6368;">Planned</td>
          </tr>
        </tbody>
      </table>
    `,
  },
  {
    id: 'meeting-notes',
    title: 'Meeting Notes',
    desc: 'Attendees, agenda & action items',
    category: 'Work',
    htmlContent: `
      <h1 style="font-size: 24pt; font-weight: bold; color: #202124;">Weekly Team Sync</h1>
      <p style="font-size: 11pt; color: #5f6368; margin-top: 4px;">Date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} &bull; 10:00 AM PST</p>
      <hr style="border: none; border-top: 1px solid #dadce0; margin: 16px 0;" />
      <h2 style="font-size: 15pt; font-weight: bold; color: #1f1f1f; margin-top: 16px;">Attendees</h2>
      <ul>
        <li>Alex Rivera (Product Lead)</li>
        <li>Elena Rostova (Engineering Manager)</li>
        <li>David Chen (Principal Designer)</li>
      </ul>
      <h2 style="font-size: 15pt; font-weight: bold; color: #1f1f1f; margin-top: 16px;">Agenda</h2>
      <ol>
        <li>Product demo of the authentic Google Docs canvas and ruler.</li>
        <li>Review Drive API token refresh and offline caching behavior.</li>
        <li>Upcoming release schedule for cross-workspace tool launcher.</li>
      </ol>
      <h2 style="font-size: 15pt; font-weight: bold; color: #1f1f1f; margin-top: 16px;">Action Items</h2>
      <div style="margin: 8px 0;"><input type="checkbox" checked style="margin-right: 8px;" /> Alex: Finalize user journey for document template creation</div>
      <div style="margin: 8px 0;"><input type="checkbox" style="margin-right: 8px;" /> Elena: Verify Google Docs HTML export fidelity</div>
      <div style="margin: 8px 0;"><input type="checkbox" style="margin-right: 8px;" /> David: Audit typography and margin alignment on 8.5" paper</div>
    `,
  },
  {
    id: 'resume',
    title: 'Modern Resume',
    desc: 'Clean professional resume layout',
    category: 'Personal',
    htmlContent: `
      <h1 style="font-size: 26pt; font-weight: bold; color: #202124; margin-bottom: 2px;">Alex Morgan</h1>
      <p style="font-size: 11pt; color: #1a73e8; margin-bottom: 16px;">alex.morgan@example.com &bull; (415) 555-0199 &bull; San Francisco, CA &bull; linkedin.com/in/alexmorgan</p>
      <hr style="border: none; border-top: 2px solid #1a73e8; margin: 8px 0 16px 0;" />
      <h2 style="font-size: 14pt; font-weight: bold; text-transform: uppercase; color: #202124; letter-spacing: 0.5px;">Experience</h2>
      <p style="font-weight: bold; margin-top: 8px;">Senior Cloud Applications Architect &bull; TechNova Solutions</p>
      <p style="font-size: 10pt; color: #5f6368;">2022 &ndash; Present | San Francisco, CA</p>
      <ul>
        <li>Architected enterprise workspace applications serving 250,000+ daily active users.</li>
        <li>Reduced API latency by 42% through intelligent client-side batching and caching.</li>
      </ul>
      <h2 style="font-size: 14pt; font-weight: bold; text-transform: uppercase; color: #202124; letter-spacing: 0.5px; margin-top: 16px;">Education</h2>
      <p style="font-weight: bold; margin-top: 8px;">B.S. in Computer Science &bull; UC Berkeley</p>
      <p style="font-size: 10pt; color: #5f6368;">Graduated with Honors</p>
    `,
  },
];
