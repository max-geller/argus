/**
 * Terminal Configuration Models
 */

export * from './kitty.model';
export * from './starship.model';
export * from './zsh.model';
// Re-export only unique types from bash.model (ShellAlias and EnvironmentVar are in zsh.model)
export type { BashConfig, BashHistory } from './bash.model';
export { BASH_SHOPT_OPTIONS, getDefaultBashConfig, parseBashConfig, stringifyBashConfig } from './bash.model';
export * from './tmux.model';

/**
 * Terminal backup metadata from Rust backend
 */
export interface TerminalBackup {
  filename: string;
  path: string;
  timestamp: number;
  configType: string;
}

/**
 * Terminal configuration types
 */
export type TerminalConfigType = 'kitty' | 'starship' | 'zsh' | 'bash' | 'tmux';
