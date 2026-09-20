/**
 * Where Omni-Search should land when a result is opened.
 *
 * The searched record itself is carried along (`item`) so the destination view can show it
 * immediately instead of waiting for its own list request to resolve and then hunting for the id.
 */
export type WorkspaceFocusSource = 'gmail' | 'calendar' | 'drive' | 'docs' | 'tasks';

export interface WorkspaceFocusTarget {
  /** Which view opens the item. */
  source: WorkspaceFocusSource;
  /** Id of the Gmail message / Calendar event / Drive file / Task. */
  id: string;
  /** The phrase that found it, so the destination list is filtered the same way. */
  query: string;
  item?: any;
  /** Tasks only: the task list the item belongs to. */
  listId?: string;
}
