import HeistDetails from "@/components/HeistDetails";

export default async function HeistDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="page-content">
      <HeistDetails id={id} />
    </div>
  );
}
