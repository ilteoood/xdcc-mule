export const searchFile = (name: string) => {
    return fetch(`/api/files?name=${name}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(res => res.json())
}