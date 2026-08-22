import { t } from "../../../i18n/core/i18n.js";

/* =========================================================
   PROFILE V2 — РЕДАКТИРОВАНИЕ NICKNAME
   ========================================================= */


const NICKNAME_MIN_LENGTH = 3
const NICKNAME_MAX_LENGTH = 20

const NICKNAME_PATTERN =
    /^[A-Za-zА-Яа-яЁё0-9_]+$/


let activeModal = null


/* =========================================================
   ОТКРЫТЬ РЕДАКТОР NICKNAME
   ========================================================= */

export function openProfileNicknameEditor({
    currentNickname = "",
    onConfirm
} = {}) {
    closeProfileNicknameEditor()

    const overlay =
        document.createElement("div")

    overlay.className =
        "profile-nickname-overlay"

    overlay.dataset.profileNicknameOverlay =
        "true"


    const modal =
        document.createElement("div")

    modal.className =
        "profile-nickname-modal"

    modal.setAttribute(
        "role",
        "dialog"
    )

    modal.setAttribute(
        "aria-modal",
        "true"
    )

    modal.setAttribute(
        "aria-labelledby",
        "profile-nickname-title"
    )


    /* =====================================================
       HEADER
       ===================================================== */

    const header =
        document.createElement("div")

    header.className =
        "profile-nickname-modal__header"


    const title =
        document.createElement("h2")

    title.id =
        "profile-nickname-title"

    title.className =
        "profile-nickname-modal__title"

    title.textContent =
        t("profile.nickname.title")


    const closeButton =
        document.createElement("button")

    closeButton.type =
        "button"

    closeButton.className =
        "profile-nickname-modal__close"

    closeButton.setAttribute(
        "aria-label",
        t("profile.nickname.closeAria")
    )

    closeButton.innerHTML = `
        <span
            class="material-symbols-rounded"
            aria-hidden="true"
        >
            close
        </span>
    `


    header.append(
        title,
        closeButton
    )


    /* =====================================================
       DESCRIPTION
       ===================================================== */

    const description =
        document.createElement("p")

    description.className =
        "profile-nickname-modal__description"

    description.textContent =
        t("profile.nickname.description")


    /* =====================================================
       INPUT
       ===================================================== */

    const field =
        document.createElement("div")

    field.className =
        "profile-nickname-modal__field"


    const input =
        document.createElement("input")

    input.type =
        "text"

    input.className =
        "profile-nickname-modal__input"

    input.value =
        String(currentNickname || "")

    input.placeholder =
        t("profile.nickname.placeholder")

    input.autocomplete =
        "off"

    input.spellcheck =
        false

    input.maxLength =
        NICKNAME_MAX_LENGTH

    input.setAttribute(
        "aria-label",
        t("profile.nickname.inputAria")
    )


    const counter =
        document.createElement("span")

    counter.className =
        "profile-nickname-modal__counter"


    field.append(
        input,
        counter
    )


    /* =====================================================
       RULES
       ===================================================== */

    const rules =
        document.createElement("p")

    rules.className =
        "profile-nickname-modal__rules"

    rules.textContent =
        t("profile.nickname.rulesFull")


    /* =====================================================
       ERROR
       ===================================================== */

    const error =
        document.createElement("div")

    error.className =
        "profile-nickname-modal__error"

    error.hidden = true


    /* =====================================================
       SAVE BUTTON
       ===================================================== */

    const saveButton =
        document.createElement("button")

    saveButton.type =
        "button"

    saveButton.className =
        "profile-nickname-modal__save"

    saveButton.textContent =
        t("profile.nickname.continue")


    /* =====================================================
       СОБИРАЕМ ОКНО
       ===================================================== */

    modal.append(
        header,
        description,
        field,
        rules,
        error,
        saveButton
    )

    overlay.append(
        modal
    )

    document.body.append(
        overlay
    )

    activeModal = overlay


    /* =====================================================
       ОБНОВИТЬ СЧЁТЧИК
       ===================================================== */

    function updateCounter() {
        counter.textContent =
            `${input.value.length}/${NICKNAME_MAX_LENGTH}`
    }


    /* =====================================================
       ПОКАЗАТЬ ОШИБКУ
       ===================================================== */

    function showError(message) {
        error.textContent =
            String(
                message ||
                t("profile.nickname.error.generic")
            )

        error.hidden = false
    }


    /* =====================================================
       СКРЫТЬ ОШИБКУ
       ===================================================== */

    function hideError() {
        error.textContent = ""
        error.hidden = true
    }


    /* =====================================================
       ВАЛИДАЦИЯ
       ===================================================== */

    function validateNickname() {
        const nickname =
            input.value.trim()

        if (
            nickname.length <
                NICKNAME_MIN_LENGTH ||
            nickname.length >
                NICKNAME_MAX_LENGTH
        ) {
            return {
                valid: false,
                message:
                    t("profile.nickname.validation.length")
            }
        }

        if (
            !NICKNAME_PATTERN.test(
                nickname
            )
        ) {
            return {
                valid: false,
                message:
                    t("profile.nickname.validation.characters")
            }
        }

        if (
            nickname ===
            String(
                currentNickname || ""
            ).trim()
        ) {
            return {
                valid: false,
                message:
                    t("profile.nickname.validation.same")
            }
        }

        return {
            valid: true,
            nickname
        }
    }


    /* =====================================================
       ПОДТВЕРЖДЕНИЕ ОДНОРАЗОВОЙ СМЕНЫ
       ===================================================== */

    async function confirmNicknameChange(
        nickname
    ) {
        const telegram =
            window.Telegram?.WebApp

        const message =
            t("profile.nickname.confirm", { nickname })


        if (
            telegram &&
            typeof telegram.showConfirm ===
                "function"
        ) {
            return await new Promise(
                (resolve) => {
                    telegram.showConfirm(
                        message,
                        (confirmed) => {
                            resolve(
                                Boolean(
                                    confirmed
                                )
                            )
                        }
                    )
                }
            )
        }


        return window.confirm(
            message
        )
    }


    /* =====================================================
       СОХРАНИТЬ
       ===================================================== */

    async function submitNickname() {
        hideError()

        const validation =
            validateNickname()

        if (!validation.valid) {
            showError(
                validation.message
            )

            return
        }


        const confirmed =
            await confirmNicknameChange(
                validation.nickname
            )

        if (!confirmed) {
            return
        }


        if (
            typeof onConfirm !==
            "function"
        ) {
            showError(
                t("profile.nickname.error.save")
            )

            return
        }


        saveButton.disabled = true
        input.disabled = true

        saveButton.textContent =
            t("profile.nickname.saving")


        try {
            await onConfirm(
                validation.nickname
            )

            closeProfileNicknameEditor()
        }

        catch (saveError) {
            console.error(
                "Profile nickname: ошибка сохранения",
                saveError
            )

            const message =
                getNicknameErrorMessage(
                    saveError
                )

            showError(message)

            saveButton.disabled = false
            input.disabled = false

            saveButton.textContent =
                t("profile.nickname.continue")

            input.focus()
        }
    }


    /* =====================================================
       EVENTS
       ===================================================== */

    closeButton.addEventListener(
        "click",
        closeProfileNicknameEditor
    )


    overlay.addEventListener(
        "click",
        (event) => {
            if (event.target === overlay) {
                closeProfileNicknameEditor()
            }
        }
    )


    input.addEventListener(
        "input",
        () => {
            hideError()
            updateCounter()
        }
    )


    input.addEventListener(
        "keydown",
        (event) => {
            if (event.key === "Enter") {
                event.preventDefault()

                submitNickname()
            }
        }
    )


    saveButton.addEventListener(
        "click",
        submitNickname
    )


    document.addEventListener(
        "keydown",
        handleEscape
    )


    function handleEscape(event) {
        if (event.key !== "Escape") {
            return
        }

        document.removeEventListener(
            "keydown",
            handleEscape
        )

        closeProfileNicknameEditor()
    }


    /* =====================================================
       START
       ===================================================== */

    updateCounter()

    requestAnimationFrame(
        () => {
            overlay.classList.add(
                "is-visible"
            )

            input.focus()
            input.select()
        }
    )
}


/* =========================================================
   ЗАКРЫТЬ РЕДАКТОР
   ========================================================= */

export function closeProfileNicknameEditor() {
    if (!activeModal) {
        return
    }

    const modal =
        activeModal

    activeModal = null

    modal.classList.remove(
        "is-visible"
    )

    window.setTimeout(
        () => {
            modal.remove()
        },
        180
    )
}


/* =========================================================
   ПОЛУЧИТЬ ТЕКСТ ОШИБКИ API
   ========================================================= */

function getNicknameErrorMessage(error) {
    if (!error) {
        return t("profile.nickname.error.change")
    }


    if (
        typeof error.detail === "string"
    ) {
        return error.detail
    }


    if (
        typeof error.message === "string" &&
        error.message.trim()
    ) {
        return error.message
    }


    return t("profile.nickname.error.change")
}