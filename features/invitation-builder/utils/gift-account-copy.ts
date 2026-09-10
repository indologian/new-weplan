export async function copyGiftAccountNumber(
	accountNumber: string,
	writeText: (value: string) => Promise<void> = (value) =>
		navigator.clipboard.writeText(value),
) {
	await writeText(accountNumber);
}
