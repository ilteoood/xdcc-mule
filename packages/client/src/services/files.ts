export const searchFile = (name: string) =>
	fetch(`/api/files?name=${name}`, {
		method: "GET",
		headers: { "Content-Type": "application/json" },
	}).then((res) => res.json());

export const refreshDatabase = () => fetch("/api/files", { method: "DELETE" });
