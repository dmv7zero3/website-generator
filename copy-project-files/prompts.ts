export interface Prompt {
  id: string;
  content: string;
  category: string;
  websiteId?: string; // To specify which SEO website to target
}
