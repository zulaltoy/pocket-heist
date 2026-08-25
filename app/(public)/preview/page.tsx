// preview page for newly created UI components
import Skeleton from "@/components/Skeleton"
import Avatar from "@/components/Avatar"

export default function PreviewPage() {
  return (
    <div className="page-content">
      <h2>Preview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        <Skeleton />
        <Skeleton />
        <Skeleton />
        <Skeleton />
        <Skeleton />
        <Skeleton />
      </div>

      <h2 className="mt-10">Avatar</h2>
      <div className="flex gap-4 mt-6">
        <Avatar name="Alice" />
        <Avatar name="JohnDoe" />
        <Avatar name="bob" />
      </div>
    </div>
  )
}
