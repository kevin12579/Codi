import { useAuth } from '../../auth/AuthContext'

const normalizeRole = (value) => String(value || 'USER').trim().toUpperCase()

export default function AdminActionButton({
  children,
  onClick,
  className = '',
  disabledClassName = 'opacity-50 cursor-not-allowed',
  requiredRole = 'ADMIN',
  unauthorizedMessage = '권한이 없습니다.',
  type = 'button',
}) {
  const { user, isLoggedIn } = useAuth()
  const isAllowed = isLoggedIn && normalizeRole(user?.role) === normalizeRole(requiredRole)

  const handleClick = (event) => {
    if (!isAllowed) {
      event.preventDefault()
      window.alert(unauthorizedMessage)
      return
    }
    onClick?.(event)
  }

  return (
    <button
      type={type}
      onClick={handleClick}
      aria-disabled={!isAllowed}
      className={`${className} ${!isAllowed ? disabledClassName : ''}`.trim()}
    >
      {children}
    </button>
  )
}
