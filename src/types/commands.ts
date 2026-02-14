export const APP_COMMAND_EVENT = 'material-explorer:command';

export type CommandAction =
  | 'save-material'
  | 'toggle-preview'
  | 'toggle-compare'
  | 'focus-material-name'
  | 'open-onboarding'
  | 'undo-material-change'
  | 'redo-material-change';

export type AppCommandEventDetail = {
  action: CommandAction;
};

export function dispatchAppCommand(action: CommandAction) {
  window.dispatchEvent(new CustomEvent<AppCommandEventDetail>(APP_COMMAND_EVENT, { detail: { action } }));
}
