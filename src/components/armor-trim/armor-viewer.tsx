import { useEffect, useEffectEvent, useLayoutEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
	EyeOff as EyeOffIcon,
	Pause as PauseIcon,
	Play as PlayIcon,
	Reload as ReloadIcon,
} from "pixelarticons/react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";
import { buildAvatar, disposeAvatar } from "@/lib/armor/scene";
import type { ArmorSelection, Skin, TrimSelection } from "@/lib/armor/selection";

interface Props {
	armor: ArmorSelection;
	trim: TrimSelection;
	skin: Skin | null;
	/** the skin texture failed to load */
	onSkinError?: () => void;
	armorHidden: boolean;
	onArmorHiddenChange: (hidden: boolean) => void;
	className?: string;
}

interface Stage {
	setAvatar: (avatar: THREE.Group) => void;
	resetView: () => void;
	setRotating: (on: boolean) => void;
}

// one turn every 20 seconds (OrbitControls: 60 / speed)
const ROTATE_SPEED = 3;

function prefersReducedMotion() {
	return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

const TARGET = new THREE.Vector3(0, 15, 0);

export default function ArmorViewer({
	armor,
	trim,
	skin,
	onSkinError,
	armorHidden,
	onArmorHiddenChange,
	className,
}: Props) {
	const host = useRef<HTMLDivElement>(null);
	const orbit = useRef<OrbitControls | null>(null);
	const stage = useRef<Stage | null>(null);
	const { t } = useI18n();
	// spins until the user grabs the model or turns it off
	const [rotating, setRotating] = useState(() => !prefersReducedMotion());
	// the latest callback, without rebuilding the avatar when only its identity changes
	const skinFailed = useEffectEvent(() => onSkinError?.());

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

		// auto-rotation runs a frame loop, only while it is on and the viewer is on screen
		let spinning = false;
		let visible = true;
		let frame = 0;
		let last = 0;
		controls.autoRotateSpeed = ROTATE_SPEED;
		const tick = (now: number) => {
			// a background tab pauses the frames: don't jump by the time it was away
			controls.update(Math.min((now - last) / 1000, 0.1)); // "change" renders
			last = now;
			frame = requestAnimationFrame(tick);
		};
		const syncLoop = () => {
			const run = spinning && visible;
			controls.autoRotate = run;
			if (run && !frame) {
				last = performance.now();
				frame = requestAnimationFrame(tick);
			} else if (!run && frame) {
				cancelAnimationFrame(frame);
				frame = 0;
			}
		};
		const onScreen = new IntersectionObserver(([entry]) => {
			visible = entry.isIntersecting;
			syncLoop();
		});
		onScreen.observe(el);
		// dragging or zooming takes over from the rotation
		controls.addEventListener("start", () => {
			if (spinning) setRotating(false);
		});

		let avatar: THREE.Group | null = null;
		stage.current = {
			resetView,
			setRotating: (on) => {
				spinning = on;
				syncLoop();
			},
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
			cancelAnimationFrame(frame);
			onScreen.disconnect();
			observer.disconnect();
			if (avatar) disposeAvatar(avatar);
			renderer.dispose();
			renderer.domElement.remove();
		};
	}, []);

	useEffect(() => stage.current?.setRotating(rotating), [rotating]);

	useEffect(() => {
		let stale = false;
		buildAvatar(armor, trim, skin).then(
			(avatar) => {
				if (stale || !stage.current) return disposeAvatar(avatar);
				stage.current.setAvatar(avatar);
			},
			(error: unknown) => {
				if (stale) return;
				if (skin) skinFailed();
				else throw error;
			},
		);
		return () => {
			stale = true;
		};
	}, [armor, trim, skin]);

	return (
		<div
			ref={host}
			className={`relative overflow-hidden rounded-md border bg-viewer ${className ?? ""}`}
		>
			<div className="absolute top-2 right-2 flex gap-1.5">
				<Button
					variant="outline"
					size="icon-sm"
					aria-label={t("armor.hideArmor")}
					aria-pressed={armorHidden}
					onClick={() => onArmorHiddenChange(!armorHidden)}
				>
					<EyeOffIcon />
				</Button>
				<Button
					variant="outline"
					size="icon-sm"
					aria-label={t("armor.autoRotate")}
					aria-pressed={rotating}
					onClick={() => setRotating((on) => !on)}
				>
					{rotating ? <PauseIcon /> : <PlayIcon />}
				</Button>
				<Button
					variant="outline"
					size="icon-sm"
					aria-label={t("armor.resetView")}
					onClick={() => stage.current?.resetView()}
				>
					<ReloadIcon />
				</Button>
			</div>
			<p className="pointer-events-none absolute inset-x-0 bottom-2 text-center text-xs text-muted-foreground">
				{t("armor.dragHint")}
			</p>
		</div>
	);
}
