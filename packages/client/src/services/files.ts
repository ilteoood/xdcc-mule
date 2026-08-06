export const searchFile = async (name: string) => {
	const res = await fetch(`/api/files?name=${name}`, {
		method: "GET",
		headers: { "Content-Type": "application/json" },
	});
	if (!res.ok) {
		throw new Error(`Search failed: ${res.status}`);
	}
	return res.json();
};

export const refreshDatabase = () => fetch("/api/files", { method: "DELETE" });
