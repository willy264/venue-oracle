"use client";

import { useEffect, useRef } from "react";

type Props = {
	open: boolean;
	titleId: string;
	describedBy?: string;
	onClose: () => void;
	header: React.ReactNode;
	body: React.ReactNode;
	footer: React.ReactNode;
};

export function CalibrationDrawer({
	open,
	titleId,
	describedBy,
	onClose,
	header,
	body,
	footer,
}: Props) {
	const dialogRef = useRef<HTMLDialogElement>(null);
	const scrollY = useRef(0);

	useEffect(() => {
		const dialog = dialogRef.current;
		if (!dialog) return;
		if (open && !dialog.open) {
			scrollY.current = window.scrollY;
			document.documentElement.style.overflow = "hidden";
			document.body.style.position = "fixed";
			document.body.style.top = `-${scrollY.current}px`;
			document.body.style.width = "100%";
			dialog.showModal();
			window.setTimeout(
				() =>
					dialog.querySelector<HTMLElement>("[data-drawer-heading]")?.focus(),
				0,
			);
		}
		if (!open && dialog.open) {
			dialog.close();
			document.documentElement.style.overflow = "";
			document.body.style.position = "";
			document.body.style.top = "";
			document.body.style.width = "";
			window.scrollTo(0, scrollY.current);
		}
	}, [open]);

	return (
		<dialog
			ref={dialogRef}
			className="calibration-drawer"
			aria-labelledby={titleId}
			aria-describedby={describedBy}
			onCancel={(event) => {
				event.preventDefault();
				onClose();
			}}
			onKeyDown={(event) => event.key === "Escape" && onClose()}
			onClick={(event) => event.target === event.currentTarget && onClose()}
		>
			<div className="calibration-drawer-panel">
				<header className="calibration-drawer-header">{header}</header>
				<div className="calibration-drawer-body">{body}</div>
				<footer className="calibration-drawer-footer">{footer}</footer>
			</div>
		</dialog>
	);
}
