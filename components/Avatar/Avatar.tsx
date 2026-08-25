import styles from "./Avatar.module.css"

interface AvatarProps {
  name: string
}

const PASCAL_CASE = /^[A-Z][a-z0-9]*(?:[A-Z][a-z0-9]*)+$/

function getInitials(name: string) {
  if (PASCAL_CASE.test(name)) {
    return (name.match(/[A-Z]/g) ?? []).slice(0, 2).join("")
  }

  return name.charAt(0).toUpperCase()
}

export default function Avatar({ name }: AvatarProps) {
  return (
    <div className={styles.avatar} role="img" aria-label={name}>
      {getInitials(name)}
    </div>
  )
}
