import { useEffect, useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { Reload as ReloadIcon } from "pixelarticons/react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";
import {
	type ArmorSelection,
	buildAvatar,
	disposeAvatar,
	type TrimSelection,
} from "@/lib/armor/scene";

interface Props {
	armor: ArmorSelection;
	trim: TrimSelection | null;
	className?: string;
}

interface Stage {
	setAvatar: (avatar: THREE.Group) => void;
	resetView: () => void;
}

const TARGET = new THREE.Vector3(0, 15, 0);

export default function ArmorViewer({ armor, trim, className }: Props) {
	const host = useRef<HTMLDivElement>(null);
	const orbit = useRef<OrbitControls | null>(null);
	const stage = useRef<Stage | null>(null);
	const { t } = useI18n();

	// the controls unhook their keydown listener from the canvas's root node: while the viewer is
	// still in the page that is the document, in a useEffect cleanup it is already the detached tree
	// and the listener left on the document kept the whole page in memory
	useLayoutEffect(
		() => () => {
			orbit.current?.dispose();
			orbit.current = null;
		},
		[],
	);

	useEffect(() => {
		const el = host.current as HTMLDivElement;
		// no MSAA: it extrapolates the UVs at triangle edges and, with nearest filtering, that draws
		// dotted lines from neighbouring texture regions. Supersample instead (at least 2x).
		const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
		renderer.setPixelRatio(Math.min(Math.max(window.devicePixelRatio, 2), 3));
		el.prepend(renderer.domElement);
		renderer.domElement.className = "block size-full touch-none";

		const scene = new THREE.Scene();
		scene.add(new THREE.AmbientLight(0xffffff, 2.2));
		const sun = new THREE.DirectionalLight(0xffffff, 1.4);
		sun.position.set(-30, 60, 50);
		scene.add(sun);

		const camera = new THREE.PerspectiveCamera(30, 1, 1, 500);
		const controls = new OrbitControls(camera, renderer.domElement);
		orbit.current = controls;
		controls.enablePan = false;
		controls.minDistance = 30;
		controls.maxDistance = 140;
		controls.maxPolarAngle = Math.PI * 0.55;
		controls.target.copy(TARGET);

		const resetView = () => {
			camera.position.set(-22, 28, 80);
			controls.target.copy(TARGET);
			controls.update();
		};
		resetView();

		// render on demand: only when the camera moves or something changes
		const render = () => renderer.render(scene, camera);
		controls.addEventListener("change", render);

		const resize = () => {
			const { clientWidth: w, clientHeight: h } = el;
			if (!w || !h) return;
			renderer.setSize(w, h, false);
			camera.aspect = w / h;
			camera.updateProjectionMatrix();
			render();
		};
		const observer = new ResizeObserver(resize);
		observer.observe(el);
		resize();

		let avatar: THREE.Group | null = null;
		stage.current = {
			resetView,
			setAvatar: (next) => {
				if (avatar) {
					scene.remove(avatar);
					disposeAvatar(avatar);
				}
				avatar = next;
				scene.add(next);
				render();
			},
		};

		return () => {
			stage.current = null;
			observer.disconnect();
			if (avatar) disposeAvatar(avatar);
			renderer.dispose();
			renderer.domElement.remove();
		};
	}, []);

	useEffect(() => {
		let stale = false;
		buildAvatar(armor, trim).then((avatar) => {
			if (stale || !stage.current) return disposeAvatar(avatar);
			stage.current.setAvatar(avatar);
		});
		return () => {
			stale = true;
		};
	}, [armor, trim]);

	return (
		<div
			ref={host}
			className={`relative overflow-hidden rounded-md border bg-card ${className ?? ""}`}
		>
			<Button
				variant="outline"
				size="icon-sm"
				className="absolute top-2 right-2"
				aria-label={t("armor.resetView")}
				onClick={() => stage.current?.resetView()}
			>
				<ReloadIcon />
			</Button>
			<p className="pointer-events-none absolute inset-x-0 bottom-2 text-center text-xs text-muted-foreground">
				{t("armor.dragHint")}
			</p>
		</div>
	);
}
