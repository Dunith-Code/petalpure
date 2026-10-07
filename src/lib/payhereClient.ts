export async function startPayHere(orderId: string) {
  const res = await fetch("/api/payhere/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || "Could not start payment");

  const form = document.createElement("form");
  form.method = "POST";
  form.action = json.action;
  for (const [name, value] of Object.entries(json.fields as Record<string, string>)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
}