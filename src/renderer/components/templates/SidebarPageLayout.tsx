type Props = {
  sidebar: React.ReactNode
  /** Content column; padded unless `bare` (when the content brings its own layout). */
  children: React.ReactNode
  bare?: boolean
}

/** Page with a navigation sidebar and a content column (social, lore, changelog). */
export default function SidebarPageLayout({
  sidebar,
  children,
  bare = false
}: Props): React.JSX.Element {
  return (
    <div className="ds-page">
      {sidebar}
      {bare ? (
        children
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-4 min-w-0 p-6">{children}</div>
      )}
    </div>
  )
}
