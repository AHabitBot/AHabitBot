SUPPORTED_LANGUAGES = {"ru", "uk", "en"}
DEFAULT_LANGUAGE = "ru"


def normalize_language(language: str | None) -> str:
    value = str(language or DEFAULT_LANGUAGE).lower()
    return value if value in SUPPORTED_LANGUAGES else DEFAULT_LANGUAGE


def plural_form(value: int, language: str) -> str:
    count = abs(int(value))
    language = normalize_language(language)

    if language == "en":
        return "one" if count == 1 else "many"

    last_two = count % 100
    last = count % 10

    if 11 <= last_two <= 14:
        return "many"
    if last == 1:
        return "one"
    if 2 <= last <= 4:
        return "few"
    return "many"


WORDS = {
    "ru": {
        "day": {"one": "день", "few": "дня", "many": "дней"},
        "confirmation": {"one": "подтверждение", "few": "подтверждения", "many": "подтверждений"},
        "friend": {"one": "друг", "few": "друга", "many": "друзей"},
    },
    "uk": {
        "day": {"one": "день", "few": "дні", "many": "днів"},
        "confirmation": {"one": "підтвердження", "few": "підтвердження", "many": "підтверджень"},
        "friend": {"one": "друг", "few": "друзі", "many": "друзів"},
    },
    "en": {
        "day": {"one": "day", "few": "days", "many": "days"},
        "confirmation": {"one": "confirmation", "few": "confirmations", "many": "confirmations"},
        "friend": {"one": "friend", "few": "friends", "many": "friends"},
    },
}


def word(kind: str, value: int, language: str) -> str:
    language = normalize_language(language)
    return WORDS[language][kind][plural_form(value, language)]


def reminder_text(language: str) -> str:
    language = normalize_language(language)
    return {
        "ru": "🔔 <b>Не забудь о своих привычках!</b>\n\nДень ещё не закончен — отметь выполненные привычки и продолжай свою серию 💪",
        "uk": "🔔 <b>Не забудь про свої звички!</b>\n\nДень ще не закінчився — відміть виконані звички та продовжуй свою серію 💪",
        "en": "🔔 <b>Don't forget your habits!</b>\n\nThe day isn't over yet — check off the habits you've completed and keep your streak going 💪",
    }[language]


def level_text(level: int, unlocked: int, language: str) -> str:
    language = normalize_language(language)
    if language == "uk":
        text = f"🥳 <b>Новий рівень!</b>\n\nТи досяг <b>{level} рівня</b>"
        return text + (f"\n\n🔓 <b>Відкрито нових аватарів: {unlocked}</b>\nЗазирни в Профіль → Зовнішній вигляд." if unlocked else "\n\n⭐ Продовжуй у тому ж темпі!")
    if language == "en":
        text = f"🥳 <b>New level!</b>\n\nYou've reached <b>level {level}</b>"
        return text + (f"\n\n🔓 <b>New avatars unlocked: {unlocked}</b>\nCheck them out in Profile → Appearance." if unlocked else "\n\n⭐ Keep it up!")
    text = f"🥳 <b>Новый уровень!</b>\n\nТы достиг <b>{level} уровня</b>"
    return text + (f"\n\n🔓 <b>Открыто новых аватаров: {unlocked}</b>\nЗагляни в Профиль → Внешний вид." if unlocked else "\n\n⭐ Продолжай в том же темпе!")


def referral_text(first_name: str, xp: int, language: str) -> str:
    language = normalize_language(language)
    if language == "uk":
        return f"🎉 <b>Новий друг!</b>\n\n<b>{first_name}</b> зареєструвався за вашим реферальним посиланням.\n\n✨ <b>+{xp} XP</b> нараховано"
    if language == "en":
        return f"🎉 <b>New friend!</b>\n\n<b>{first_name}</b> joined through your referral link.\n\n✨ <b>+{xp} XP</b> earned"
    return f"🎉 <b>Новый друг!</b>\n\n<b>{first_name}</b> зарегистрировался по вашей реферальной ссылке.\n\n✨ <b>+{xp} XP</b> начислено"


def achievement_text(kind: str, targets: list[int], xp: int, next_target: int | None, language: str) -> str:
    language = normalize_language(language)
    targets = sorted({int(x) for x in targets if int(x) > 0})
    single = len(targets) == 1

    labels = {
        "ru": {"title1": "🏆 <b>Новое достижение!</b>", "titleN": "🏆 <b>Получены достижения!</b>", "streak": "🔥 Серия", "confirmation": "✅ Подтверждения", "invitation": "👥 Приглашения", "earned": "начислено", "next": "Следующая цель"},
        "uk": {"title1": "🏆 <b>Нове досягнення!</b>", "titleN": "🏆 <b>Отримано досягнення!</b>", "streak": "🔥 Серія", "confirmation": "✅ Підтвердження", "invitation": "👥 Запрошення", "earned": "нараховано", "next": "Наступна ціль"},
        "en": {"title1": "🏆 <b>New achievement!</b>", "titleN": "🏆 <b>Achievements earned!</b>", "streak": "🔥 Streak", "confirmation": "✅ Confirmations", "invitation": "👥 Invitations", "earned": "earned", "next": "Next goal"},
    }[language]

    def target_label(value: int) -> str:
        if kind == "streak":
            return f"{value} {word('day', value, language)}"
        if kind == "invitation":
            return f"{value} {word('friend', value, language)}"
        return str(value)

    lines = [f"{labels[kind]} — <b>{target_label(x)}</b>" for x in targets]
    title = labels["title1"] if single else labels["titleN"]
    text = title + "\n\n" + "\n".join(lines) + f"\n\n⭐ <b>+{xp} XP</b>"
    if not single:
        text += f" {labels['earned']}"
    if next_target is not None:
        next_label = target_label(next_target)
        if kind == "confirmation":
            next_label = f"{next_target} {word('confirmation', next_target, language)}"
        text += f"\n\n{labels['next']} — <b>{next_label}</b>"
    return text
