import ClineLogoVariable from "@/assets/ClineLogoVariable"
import HeroTooltip from "@/components/common/HeroTooltip"
import { useTranslation } from "@/context/TranslationContext"

const HomeHeader = () => {
	const { t, isRtl } = useTranslation()

	return (
		<div className={`flex flex-col items-center mb-5 ${isRtl ? "rtl" : ""}`}>
			<div className="my-5">
				<ClineLogoVariable className="size-16" />
			</div>
			<div className="text-center flex items-center justify-center">
				<h2 className="m-0 text-[var(--vscode-font-size)]">{t("home.whatCanIDo")}</h2>
				<HeroTooltip placement="bottom" className="max-w-[300px]" content={t("home.capabilities")}>
					<span
						className="codicon codicon-info ml-2 cursor-pointer"
						style={{ fontSize: "14px", color: "var(--vscode-textLink-foreground)" }}
					/>
				</HeroTooltip>
			</div>
		</div>
	)
}

export default HomeHeader
