"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowDownBoxIcon } from "@/components/ui/icons";

export default function ExploreButton() {
	const router = useRouter();
	return (
		<Button
			className="mt-4 px-6 text-md"
			onClick={() => router.push("/#tools")}
		>
			<ArrowDownBoxIcon />
			Explore
		</Button>
	);
}
