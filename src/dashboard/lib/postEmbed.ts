/** The platform's own embeddable view of a post, when the link is a recognisable post link. */
export function embedUrl(postUrl: string): string | null {
  const instagram = postUrl.match(/instagram\.com\/(p|reel|tv)\/([A-Za-z0-9_-]+)/);
  if (instagram) return `https://www.instagram.com/${instagram[1]}/${instagram[2]}/embed/`;
  const tiktok = postUrl.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/);
  if (tiktok) return `https://www.tiktok.com/embed/v2/${tiktok[1]}`;
  return null;
}
