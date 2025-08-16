'use client';
import { observer } from "mobx-react-lite";
import { Modal } from "../primitive";
import { useStore } from "@/stores/StoreProvider";
import PreviewSectionCard from "../section/PreviewSectionCard";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";

function StrategusModal() {
    const { study } = useStore();
    const { strategusModalOpen, setStrategusModalOpen } = study
    useBodyScrollLock(strategusModalOpen)
    return (
        <Modal open={strategusModalOpen} onClose={() => setStrategusModalOpen(false)}>
            <PreviewSectionCard />
        </Modal>
    )
}

export default observer(StrategusModal)