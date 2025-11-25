/**
 * Hyprland key names and action types for the keybinding editor
 */

export const HYPRLAND_MODIFIERS = [
  { value: '$mainMod', label: 'Super' },
  { value: 'SHIFT', label: 'Shift' },
  { value: 'CTRL', label: 'Ctrl' },
  { value: 'ALT', label: 'Alt' }
] as const;

export const HYPRLAND_KEYS = {
  letters: [
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
    'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
  ],
  numbers: [
    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'
  ],
  numpad: [
    'KP_0', 'KP_1', 'KP_2', 'KP_3', 'KP_4', 'KP_5', 'KP_6', 'KP_7', 'KP_8', 'KP_9',
    'KP_ADD', 'KP_SUBTRACT', 'KP_MULTIPLY', 'KP_DIVIDE', 'KP_ENTER'
  ],
  function: [
    'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'
  ],
  navigation: [
    'left', 'right', 'up', 'down',
    'Home', 'End', 'Page_Up', 'Page_Down'
  ],
  editing: [
    'RETURN', 'TAB', 'BackSpace', 'Delete', 'Insert'
  ],
  special: [
    'SPACE', 'Escape', 'Print', 'Pause', 'Scroll_Lock', 'Caps_Lock'
  ],
  media: [
    'XF86AudioRaiseVolume',
    'XF86AudioLowerVolume',
    'XF86AudioMute',
    'XF86AudioPlay',
    'XF86AudioPause',
    'XF86AudioNext',
    'XF86AudioPrev',
    'XF86MonBrightnessUp',
    'XF86MonBrightnessDown'
  ],
  mouse: [
    { value: 'mouse:272', label: 'Left Click' },
    { value: 'mouse:273', label: 'Right Click' },
    { value: 'mouse:274', label: 'Middle Click' }
  ]
} as const;

export const WINDOW_ACTIONS = [
  { value: 'killactive', label: 'Kill Active Window', params: false },
  { value: 'togglefloating', label: 'Toggle Floating', params: false },
  { value: 'fullscreen', label: 'Toggle Fullscreen', params: false },
  { value: 'pseudo', label: 'Pseudo Tile', params: false },
  { value: 'togglesplit', label: 'Toggle Split', params: false },
  { value: 'pin', label: 'Pin Window', params: false },
  { value: 'cyclenext', label: 'Cycle Next Window', params: false },
  { value: 'cycleprev', label: 'Cycle Previous Window', params: false }
] as const;

export const FOCUS_ACTIONS = [
  { value: 'movefocus', label: 'Move Focus', params: 'direction', options: ['l', 'r', 'u', 'd', 'left', 'right', 'up', 'down'] },
  { value: 'focusmonitor', label: 'Focus Monitor', params: 'monitor' }
] as const;

export const WORKSPACE_ACTIONS = [
  { value: 'workspace', label: 'Switch to Workspace', params: 'workspace' },
  { value: 'movetoworkspace', label: 'Move to Workspace', params: 'workspace' }
] as const;

export const SYSTEM_ACTIONS = [
  { value: 'exit', label: 'Exit Hyprland', params: false }
] as const;

export const ACTION_TYPES = {
  exec: { label: 'Execute Command', hasParams: true, paramLabel: 'Command' },
  window: { label: 'Window Action', hasParams: false },
  workspace: { label: 'Workspace', hasParams: true, paramLabel: 'Workspace Number' },
  focus: { label: 'Focus Direction', hasParams: true, paramLabel: 'Direction' },
  system: { label: 'System', hasParams: false },
  custom: { label: 'Custom', hasParams: true, paramLabel: 'Action & Parameters' }
} as const;

// Get all keys flattened
export function getAllKeys(): { value: string; label: string; category: string }[] {
  const keys: { value: string; label: string; category: string }[] = [];
  
  HYPRLAND_KEYS.letters.forEach(k => keys.push({ value: k, label: k, category: 'Letters' }));
  HYPRLAND_KEYS.numbers.forEach(k => keys.push({ value: k, label: k, category: 'Numbers' }));
  HYPRLAND_KEYS.numpad.forEach(k => keys.push({ value: k, label: k, category: 'Numpad' }));
  HYPRLAND_KEYS.function.forEach(k => keys.push({ value: k, label: k, category: 'Function' }));
  HYPRLAND_KEYS.navigation.forEach(k => keys.push({ value: k, label: k, category: 'Navigation' }));
  HYPRLAND_KEYS.editing.forEach(k => keys.push({ value: k, label: k, category: 'Editing' }));
  HYPRLAND_KEYS.special.forEach(k => keys.push({ value: k, label: k, category: 'Special' }));
  HYPRLAND_KEYS.media.forEach(k => keys.push({ value: k, label: k, category: 'Media' }));
  HYPRLAND_KEYS.mouse.forEach(m => keys.push({ value: m.value, label: m.label, category: 'Mouse' }));
  
  return keys;
}



