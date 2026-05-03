import { useEffect, useState } from "react";
import MultipleUsersBubble from "@/components/MultipleUsersBubble";
import { _useContext } from "../Context";
import { useParams } from "react-router-dom";
import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import "./board.css";

function getDocumentTheme() {
	const currentTheme = document.documentElement.getAttribute("data-theme");

	if (currentTheme === "dark" || currentTheme === "light") {
		return currentTheme;
	}

	return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export default function Board() {
	const { state } = _useContext();
	const selectedTeam = state.teams.find((team) => team._id === state.user.selectedTeam) ?? state.teams[0];
	const [theme, setTheme] = useState<"light" | "dark">(getDocumentTheme());

    const params = useParams();

	useEffect(() => {
		const root = document.documentElement;
		const observer = new MutationObserver(() => {
			setTheme(getDocumentTheme());
		});

		observer.observe(root, {
			attributes: true,
			attributeFilter: ["data-theme", "class"],
		});

		return () => observer.disconnect();
	}, []);

	return (
		<main>
            <section className="w-full flex flex-col justify-between items-center">
                <div className="flex">
                    <h3>hi: {params.id}</h3>
                    <h2></h2>
                    {selectedTeam ? <MultipleUsersBubble members={selectedTeam.members} /> : null}
                </div>

                <div className={`w-full h-screen excalidraw-wrapper theme--${theme}`}>
                    <Excalidraw
                        theme={theme}
                        renderTopRightUI={() => null}
                        UIOptions={{
                            canvasActions: {
                                changeViewBackgroundColor: false,
                                clearCanvas: false,
                                export: false,
                                loadScene: false,
                                saveAsImage: false,
                                saveToActiveFile: false,
                                toggleTheme: null,
                            },
                        }}
                    />
                </div>
            </section>
		</main>
	);
}
