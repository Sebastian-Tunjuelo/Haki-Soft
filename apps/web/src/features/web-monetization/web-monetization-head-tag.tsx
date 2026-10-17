/**
 * Inyecta `<link rel="monetization">` solo con wallet https verificada (SPEC-04 RF-04).
 * Server Component: el href nunca sale de un input libre del usuario.
 */
export function WebMonetizationHeadTag({
  webMonetizationEnabled,
  verifiedWalletAddressUrl,
}: {
  webMonetizationEnabled: boolean;
  verifiedWalletAddressUrl: string | null;
}) {
  if (!webMonetizationEnabled || !verifiedWalletAddressUrl?.startsWith('https://')) {
    return null;
  }
  if (/["'<>]/.test(verifiedWalletAddressUrl)) {
    return null;
  }
  return <link rel="monetization" href={verifiedWalletAddressUrl} />;
}
