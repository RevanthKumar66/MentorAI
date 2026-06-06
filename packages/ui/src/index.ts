// Design System Colors & Constants for MentorAI OS
export const DESIGN_TOKENS = {
  colors: {
    dark: {
      background: 'hsl(222.2, 84%, 4.9%)',
      foreground: 'hsl(210, 40%, 98%)',
      card: 'hsl(222.2, 84%, 4.9%)',
      border: 'hsl(217.2, 32.6%, 17.5%)',
      primary: 'hsl(217.2, 91.2%, 59.8%)',
      accent: 'hsl(263.4, 70%, 50.4%)', // Sleek Purple
    },
    light: {
      background: 'hsl(0, 0%, 100%)',
      foreground: 'hsl(222.2, 84%, 4.9%)',
      card: 'hsl(0, 0%, 100%)',
      border: 'hsl(214.3, 31.8%, 91.4%)',
      primary: 'hsl(221.2, 83.2%, 53.3%)',
      accent: 'hsl(262.1, 83.3%, 57.8%)',
    }
  },
  animations: {
    transitionFast: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
    transitionNormal: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  }
};
export type DesignTokens = typeof DESIGN_TOKENS;
export default DESIGN_TOKENS;
