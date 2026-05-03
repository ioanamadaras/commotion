import { _useContext } from "@/Context";

export default function SettingsModal() {
    const { setState } = _useContext();

    return (
        <div className="fixed inset-0 bg-[#0006] z-10 flex"
            onClick={() => setState(prev => ({ ...prev, isModalOpen: false }))}
        >
            <div
                className="w-[min(28rem,calc(100vw-var(--padding)*2))] mx-[var(--padding)] mt-auto mb-[4.5rem] bg-[var(--bg)] py-[var(--padding)] px-4 rounded-lg"
                onClick={(e) => e.stopPropagation()}
            >	
                <div className="flex w-full justify-between items-center">
                    <h2 className="text-xl font-bold mb-4">Settings</h2>
                    <div 
                        onClick={() => setState(prev => ({ ...prev, isModalOpen: false }))}
                        className="cursor-pointer text-[var(--text)] hover:text-gray-500"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                </div>
                <p>Here you can manage your account settings.</p>
                <br />
                <p>Here you can manage your account settings.</p>
                <br />
                <p>Here you can manage your account settings.</p>
                <br />
                <hr />
                <p>Here you can manage your account settings.</p>

            </div>
		</div>
    )
}
