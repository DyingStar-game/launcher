import { useNavigationStore } from '@store/navigation'
import AccountPanel from '@components/panel/accountPanel'
import GamePanel from '@components/panel/gamePanel'
import SocialPanel from '@components/panel/socialPanel'
import FilesPanel from '@components/panel/filesPanel'

export default function UniverseTesting(): React.JSX.Element {
  useNavigationStore()

  return (
    <div className="h-full flex flex-col gap-0">

      {/* Bandeau TEST */}
      <div className="shrink-0 flex items-center justify-center gap-3 px-4 py-1.5 bg-amber-500/10 border-b border-amber-500/30">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-400 uppercase tracking-[0.2em]">
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current shrink-0" aria-hidden="true">
            <path d="M12 2a10 10 0 100 20A10 10 0 0012 2zm0 18a8 8 0 110-16 8 8 0 010 16zm-1-5h2v2h-2zm0-8h2v6h-2z" />
          </svg>
          Environnement de test — les données ne sont pas celles du serveur live
        </span>
      </div>

      {/* Grille identique à Universe */}
      <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-4 p-4">
        <AccountPanel />
        <SocialPanel />
        <GamePanel />
        <FilesPanel />
      </div>
    </div>
  )
}