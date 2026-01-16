
async function getSOW(slug) {
  const res = await fetch(`http://localhost:3000/api/sow?slug=${slug}`, { cache: 'no-store' });
  return res.json();
}

export default async function SOWViewer({ params }) {
  const sow = await getSOW(params.slug);
  return (
    <div className="p-8">
      <h1 className="text-xl font-bold mb-4">Scope of Work: {sow.client_name}</h1>
      <p><strong>Scope:</strong> {sow.project_scope}</p>
      <p><strong>Timeline:</strong> {sow.timeline}</p>
      <p><strong>Total:</strong> {sow.total_amount} {sow.currency}</p>
      <p><strong>Email:</strong> {sow.email}</p>
    </div>
  );
}
