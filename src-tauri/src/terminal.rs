// Terminal configuration management module
// Handles reading, writing, and backing up terminal configs (kitty, starship, zsh, bash, tmux)

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::time::{SystemTime, UNIX_EPOCH};

/// Supported terminal configuration types
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TerminalConfigType {
    Kitty,
    Starship,
    Zsh,
    Bash,
    Tmux,
}

impl TerminalConfigType {
    fn from_str(s: &str) -> Option<Self> {
        match s.to_lowercase().as_str() {
            "kitty" => Some(Self::Kitty),
            "starship" => Some(Self::Starship),
            "zsh" => Some(Self::Zsh),
            "bash" => Some(Self::Bash),
            "tmux" => Some(Self::Tmux),
            _ => None,
        }
    }
}

/// Get the home directory
fn get_home() -> Result<PathBuf, String> {
    std::env::var("HOME")
        .map(PathBuf::from)
        .map_err(|_| "Could not determine HOME directory".to_string())
}

/// Get the configuration file path for a terminal config type
fn get_config_path(config_type: TerminalConfigType) -> Result<PathBuf, String> {
    let home = get_home()?;

    let path = match config_type {
        TerminalConfigType::Kitty => home.join(".config/kitty/kitty.conf"),
        TerminalConfigType::Starship => home.join(".config/starship/starship.toml"),
        TerminalConfigType::Zsh => home.join(".zshrc"),
        TerminalConfigType::Bash => home.join(".bashrc"),
        TerminalConfigType::Tmux => home.join(".tmux.conf"),
    };

    Ok(path)
}

/// Get the backup directory for a terminal config type
fn get_backup_dir(config_type: TerminalConfigType) -> Result<PathBuf, String> {
    let home = get_home()?;

    let type_name = match config_type {
        TerminalConfigType::Kitty => "kitty",
        TerminalConfigType::Starship => "starship",
        TerminalConfigType::Zsh => "zsh",
        TerminalConfigType::Bash => "bash",
        TerminalConfigType::Tmux => "tmux",
    };

    let backup_dir = home
        .join(".config/argus/terminal")
        .join(type_name)
        .join("backups");

    // Create directory if it doesn't exist
    if !backup_dir.exists() {
        fs::create_dir_all(&backup_dir)
            .map_err(|e| format!("Failed to create backup directory: {}", e))?;
    }

    Ok(backup_dir)
}

/// Read a terminal configuration file
#[tauri::command]
pub fn terminal_read_config(config_type: &str) -> Result<String, String> {
    println!("=== terminal_read_config called for {} ===", config_type);

    let terminal_type = TerminalConfigType::from_str(config_type)
        .ok_or_else(|| format!("Unknown config type: {}", config_type))?;

    let config_path = get_config_path(terminal_type)?;
    println!("  Config path: {:?}", config_path);

    if !config_path.exists() {
        println!("  Config file does not exist");
        return Err(format!("Config file not found: {:?}", config_path));
    }

    let content = fs::read_to_string(&config_path)
        .map_err(|e| format!("Failed to read config file {:?}: {}", config_path, e))?;

    println!("  Successfully read {} bytes", content.len());
    Ok(content)
}

/// Write a terminal configuration file (creates backup first)
#[tauri::command]
pub fn terminal_write_config(config_type: &str, content: &str) -> Result<(), String> {
    println!("=== terminal_write_config called for {} ===", config_type);

    let terminal_type = TerminalConfigType::from_str(config_type)
        .ok_or_else(|| format!("Unknown config type: {}", config_type))?;

    let config_path = get_config_path(terminal_type)?;
    println!("  Config path: {:?}", config_path);

    // Create backup before writing if file exists
    if config_path.exists() {
        let backup_path = create_backup_internal(terminal_type)?;
        println!("  Backup created at: {:?}", backup_path);
    }

    // Ensure parent directory exists
    if let Some(parent) = config_path.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create config directory: {}", e))?;
        }
    }

    fs::write(&config_path, content)
        .map_err(|e| format!("Failed to write config file {:?}: {}", config_path, e))?;

    println!("  Successfully wrote {} bytes", content.len());
    Ok(())
}

/// Get the path to a terminal configuration file
#[tauri::command]
pub fn terminal_get_path(config_type: &str) -> Result<String, String> {
    let terminal_type = TerminalConfigType::from_str(config_type)
        .ok_or_else(|| format!("Unknown config type: {}", config_type))?;

    let path = get_config_path(terminal_type)?;
    Ok(path.to_string_lossy().to_string())
}

/// Check if a terminal configuration file exists
#[tauri::command]
pub fn terminal_config_exists(config_type: &str) -> Result<bool, String> {
    let terminal_type = TerminalConfigType::from_str(config_type)
        .ok_or_else(|| format!("Unknown config type: {}", config_type))?;

    let path = get_config_path(terminal_type)?;
    Ok(path.exists())
}

/// Create a timestamped backup of a terminal configuration
fn create_backup_internal(config_type: TerminalConfigType) -> Result<PathBuf, String> {
    let config_path = get_config_path(config_type)?;
    let backup_dir = get_backup_dir(config_type)?;

    if !config_path.exists() {
        return Err(format!("Config file does not exist: {:?}", config_path));
    }

    let content = fs::read_to_string(&config_path)
        .map_err(|e| format!("Failed to read config for backup: {}", e))?;

    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs();

    let extension = match config_type {
        TerminalConfigType::Kitty => "conf",
        TerminalConfigType::Starship => "toml",
        TerminalConfigType::Zsh => "zshrc",
        TerminalConfigType::Bash => "bashrc",
        TerminalConfigType::Tmux => "conf",
    };

    let backup_filename = format!("{}.{}", timestamp, extension);
    let backup_path = backup_dir.join(&backup_filename);

    fs::write(&backup_path, content)
        .map_err(|e| format!("Failed to write backup: {}", e))?;

    Ok(backup_path)
}

/// Create a timestamped backup of a terminal configuration
#[tauri::command]
pub fn terminal_backup_config(config_type: &str) -> Result<String, String> {
    println!("=== terminal_backup_config called for {} ===", config_type);

    let terminal_type = TerminalConfigType::from_str(config_type)
        .ok_or_else(|| format!("Unknown config type: {}", config_type))?;

    let backup_path = create_backup_internal(terminal_type)?;

    println!("  Backup created: {:?}", backup_path);
    Ok(backup_path.to_string_lossy().to_string())
}

/// Backup metadata for listing
#[derive(Serialize, Deserialize, Clone)]
pub struct TerminalBackup {
    pub filename: String,
    pub path: String,
    pub timestamp: u64,
    #[serde(rename = "configType")]
    pub config_type: String,
}

/// List all backups for a terminal configuration type
#[tauri::command]
pub fn terminal_list_backups(config_type: &str) -> Result<Vec<TerminalBackup>, String> {
    println!("=== terminal_list_backups called for {} ===", config_type);

    let terminal_type = TerminalConfigType::from_str(config_type)
        .ok_or_else(|| format!("Unknown config type: {}", config_type))?;

    let backup_dir = get_backup_dir(terminal_type)?;

    if !backup_dir.exists() {
        return Ok(vec![]);
    }

    let mut backups: Vec<TerminalBackup> = Vec::new();

    for entry in fs::read_dir(&backup_dir)
        .map_err(|e| format!("Failed to read backup directory: {}", e))?
    {
        let entry = entry.map_err(|e| format!("Failed to read directory entry: {}", e))?;
        let path = entry.path();

        if path.is_file() {
            if let Some(filename) = path.file_name().and_then(|n| n.to_str()) {
                // Parse timestamp from filename (format: timestamp.extension)
                if let Some(timestamp_str) = filename.split('.').next() {
                    if let Ok(timestamp) = timestamp_str.parse::<u64>() {
                        backups.push(TerminalBackup {
                            filename: filename.to_string(),
                            path: path.to_string_lossy().to_string(),
                            timestamp,
                            config_type: config_type.to_string(),
                        });
                    }
                }
            }
        }
    }

    // Sort by timestamp (newest first)
    backups.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));

    println!("  Found {} backups", backups.len());
    Ok(backups)
}

/// Restore a backup
#[tauri::command]
pub fn terminal_restore_backup(config_type: &str, backup_path: &str) -> Result<String, String> {
    println!("=== terminal_restore_backup called for {} ===", config_type);
    println!("  Backup path: {}", backup_path);

    let terminal_type = TerminalConfigType::from_str(config_type)
        .ok_or_else(|| format!("Unknown config type: {}", config_type))?;

    let backup_file = PathBuf::from(backup_path);

    if !backup_file.exists() {
        return Err(format!("Backup file not found: {}", backup_path));
    }

    let content = fs::read_to_string(&backup_file)
        .map_err(|e| format!("Failed to read backup: {}", e))?;

    // Create a backup of current config before restoring
    let config_path = get_config_path(terminal_type)?;
    if config_path.exists() {
        create_backup_internal(terminal_type)?;
    }

    // Write the restored content
    fs::write(&config_path, &content)
        .map_err(|e| format!("Failed to restore config: {}", e))?;

    println!("  Backup restored successfully");
    Ok(content)
}

/// Delete a backup
#[tauri::command]
pub fn terminal_delete_backup(backup_path: &str) -> Result<(), String> {
    println!("=== terminal_delete_backup called ===");
    println!("  Backup path: {}", backup_path);

    let backup_file = PathBuf::from(backup_path);

    if !backup_file.exists() {
        return Err(format!("Backup file not found: {}", backup_path));
    }

    fs::remove_file(&backup_file)
        .map_err(|e| format!("Failed to delete backup: {}", e))?;

    println!("  Backup deleted successfully");
    Ok(())
}

/// Create a default configuration for a terminal type
#[tauri::command]
pub fn terminal_create_default(config_type: &str) -> Result<String, String> {
    println!("=== terminal_create_default called for {} ===", config_type);

    let terminal_type = TerminalConfigType::from_str(config_type)
        .ok_or_else(|| format!("Unknown config type: {}", config_type))?;

    let default_content = match terminal_type {
        TerminalConfigType::Kitty => get_default_kitty_config(),
        TerminalConfigType::Starship => get_default_starship_config(),
        TerminalConfigType::Zsh => get_default_zsh_config(),
        TerminalConfigType::Bash => get_default_bash_config(),
        TerminalConfigType::Tmux => get_default_tmux_config(),
    };

    let config_path = get_config_path(terminal_type)?;

    // Backup existing config if it exists
    if config_path.exists() {
        create_backup_internal(terminal_type)?;
    }

    // Ensure parent directory exists
    if let Some(parent) = config_path.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create config directory: {}", e))?;
        }
    }

    fs::write(&config_path, &default_content)
        .map_err(|e| format!("Failed to write default config: {}", e))?;

    println!("  Default config created at {:?}", config_path);
    Ok(default_content)
}

// ========== DEFAULT CONFIGURATIONS ==========

fn get_default_kitty_config() -> String {
    r#"# Kitty Terminal Configuration
# Generated by Argus

# Font
font_family      JetBrains Mono Nerd Font
bold_font        auto
italic_font      auto
bold_italic_font auto
font_size        12.0

# Cursor
cursor_shape beam
cursor_blink_interval 0.5

# Scrollback
scrollback_lines 10000

# Mouse
copy_on_select clipboard

# Window
remember_window_size  yes
initial_window_width  120c
initial_window_height 40c
window_padding_width  8

# Tab bar
tab_bar_edge bottom
tab_bar_style powerline

# Bell
enable_audio_bell no

# Shell
shell .

# Theme (include your theme file)
# include catppuccin.conf
"#.to_string()
}

fn get_default_starship_config() -> String {
    r#"# Starship Prompt Configuration
# Generated by Argus

format = """
$os\
$username\
$directory\
$git_branch\
$git_status\
$nodejs\
$rust\
$golang\
$python\
$line_break\
$character"""

[character]
success_symbol = "[❯](green)"
error_symbol = "[❯](red)"

[os]
disabled = false

[directory]
truncation_length = 3
truncate_to_repo = true

[git_branch]
symbol = " "

[git_status]
ahead = "⇡${count}"
behind = "⇣${count}"
diverged = "⇕⇡${ahead_count}⇣${behind_count}"

[nodejs]
symbol = " "

[rust]
symbol = " "

[golang]
symbol = " "

[python]
symbol = " "
"#.to_string()
}

fn get_default_zsh_config() -> String {
    r#"# Zsh Configuration
# Generated by Argus

# History
HISTFILE=~/.zsh_history
HISTSIZE=10000
SAVEHIST=10000
setopt SHARE_HISTORY
setopt HIST_IGNORE_DUPS
setopt HIST_IGNORE_SPACE

# Basic Options
setopt AUTO_CD
setopt INTERACTIVE_COMMENTS
setopt CORRECT

# Key bindings (emacs mode)
bindkey -e
bindkey '^[[A' history-search-backward
bindkey '^[[B' history-search-forward

# Aliases
alias ls='ls --color=auto'
alias ll='ls -la'
alias la='ls -A'
alias l='ls -CF'
alias grep='grep --color=auto'

# Starship prompt (if installed)
if command -v starship &> /dev/null; then
    eval "$(starship init zsh)"
fi

# Zoxide (if installed)
if command -v zoxide &> /dev/null; then
    eval "$(zoxide init zsh)"
fi
"#.to_string()
}

fn get_default_bash_config() -> String {
    r#"# Bash Configuration
# Generated by Argus

# If not running interactively, don't do anything
case $- in
    *i*) ;;
      *) return;;
esac

# History
HISTCONTROL=ignoreboth
HISTSIZE=1000
HISTFILESIZE=2000
shopt -s histappend

# Check window size after each command
shopt -s checkwinsize

# Make less more friendly for non-text input files
[ -x /usr/bin/lesspipe ] && eval "$(SHELL=/bin/sh lesspipe)"

# Aliases
alias ls='ls --color=auto'
alias ll='ls -la'
alias la='ls -A'
alias l='ls -CF'
alias grep='grep --color=auto'
alias fgrep='fgrep --color=auto'
alias egrep='egrep --color=auto'

# Starship prompt (if installed)
if command -v starship &> /dev/null; then
    eval "$(starship init bash)"
fi

# Source additional configs from ~/.bashrc.d/
if [ -d ~/.bashrc.d ]; then
    for rc in ~/.bashrc.d/*; do
        if [ -f "$rc" ]; then
            . "$rc"
        fi
    done
fi
"#.to_string()
}

fn get_default_tmux_config() -> String {
    r##"# Tmux Configuration
# Generated by Argus

# Prefix: Ctrl+a
set -g prefix C-a
unbind C-b
bind C-a send-prefix

# Mouse support
set -g mouse on

# History
set -g history-limit 10000

# Start windows and panes at 1
set -g base-index 1
setw -g pane-base-index 1

# Renumber windows when one is closed
set -g renumber-windows on

# Status bar
set -g status-position bottom
set -g status-style 'bg=#1e1e2e fg=#cdd6f4'
set -g status-left '#[fg=#89b4fa,bold] #S '
set -g status-right '#[fg=#a6adc8] %H:%M '
set -g status-left-length 20

# Window status
setw -g window-status-format '#[fg=#6c7086] #I:#W '
setw -g window-status-current-format '#[fg=#89b4fa,bold] #I:#W '

# Splits with current path
bind | split-window -h -c "#{pane_current_path}"
bind - split-window -v -c "#{pane_current_path}"
unbind '"'
unbind %

# Vim-style pane navigation
bind h select-pane -L
bind j select-pane -D
bind k select-pane -U
bind l select-pane -R

# Resize panes with Vim keys
bind -r H resize-pane -L 5
bind -r J resize-pane -D 5
bind -r K resize-pane -U 5
bind -r L resize-pane -R 5

# Quick window switching
bind -n M-1 select-window -t 1
bind -n M-2 select-window -t 2
bind -n M-3 select-window -t 3
bind -n M-4 select-window -t 4
bind -n M-5 select-window -t 5

# Reload config
bind r source-file ~/.tmux.conf \; display "Config reloaded!"

# Escape time (for vim)
set -sg escape-time 0

# True color support
set -g default-terminal "tmux-256color"
set -ag terminal-overrides ",xterm-256color:RGB"
"##.to_string()
}
