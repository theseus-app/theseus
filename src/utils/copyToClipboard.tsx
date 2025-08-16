export default async function copyToClipboard(jsonPretty: string) {
    await navigator.clipboard.writeText(jsonPretty);
    alert("Copied to clipboard");
}