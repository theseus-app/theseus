export default async function copyToClipboard(jsonPretty: string) {
    await navigator.clipboard.writeText(jsonPretty);
    alert("JSON copied to clipboard");
}