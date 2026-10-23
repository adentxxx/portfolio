import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** Clearly fake DEMO placeholders — not a real biography. */
async function main() {
  await prisma.projectSection.deleteMany();
  await prisma.project.deleteMany();
  await prisma.company.deleteMany();
  await prisma.bloubEmotion.deleteMany();
  await prisma.siteSettings.deleteMany();

  // Emotions = states of the bloub engine (src/lib/bloub-engine/states.ts).
  // `expression` only applies to the `idle` state (rest face).
  await prisma.bloubEmotion.createMany({
    data: [
      { id: "wave", label: "Привет — wink", state: "wink" },
      { id: "focus", label: "Думает — thinking", state: "thinking" },
      { id: "spark", label: "Орбита — orbit", state: "orbit" },
      { id: "calm", label: "Спокоен — idle · heureux", state: "idle", expression: "heureux" },
      { id: "curious", label: "Любопытен — idle · curieux", state: "idle", expression: "curieux" },
      { id: "proud", label: "Горд — idle · fier", state: "idle", expression: "fier" },
      { id: "wide", label: "Удивлён — wide", state: "wide" },
      { id: "alert", label: "Внимание — alert", state: "alert" },
      { id: "notify", label: "Уведомление — notify", state: "notify" },
      { id: "exclaim", label: "Восклицание — exclaim", state: "exclaim" },
      { id: "sleep", label: "Спит — sleep", state: "sleep" },
      { id: "egg", label: "Яйцо — egg", state: "egg" },
      { id: "hexagon", label: "Шестиугольник — hexagon", state: "hexagon" },
      { id: "play", label: "Играет — play", state: "play" },
      { id: "burst", label: "Взрыв — burst", state: "burst" },
      { id: "comet", label: "Комета — comet", state: "comet" },
    ],
  });

  await prisma.siteSettings.create({
    data: {
      id: "default",
      // Typewriter headline: one phrase per line (see IntroCard / Typewriter)
      introHeadline: [
        "Привет, давай знакомиться",
        "Меня кстати зовут Саня",
        "Ты можешь скроллить и смотреть проекты",
      ].join("\n"),
      introBio:
        "Это демо-портфолио (placeholder). Имена компаний и проектов случайные — не реальная биография. Замените через /admin.",
      avatarSrc: "/avatars/avatar.png",
      avatarFacesJson: JSON.stringify([
        "/faces/face_1.png",
        "/faces/face_2.png",
        "/faces/face_3.png",
        "/faces/face_4.png",
      ]),
      introLinksJson: JSON.stringify([
        { label: "Telegram", href: "https://t.me/", icon: "send" },
        { label: "CV", href: "#", icon: "file" },
        { label: "LinkedIn", href: "https://linkedin.com/", icon: "link" },
      ]),
      contactHeadline: "Связаться",
      contactSubline:
        "Демо-контакты. Подставьте свои ссылки в админке или сиде.",
      contactLinksJson: JSON.stringify([
        { label: "Telegram", href: "https://t.me/" },
        { label: "Email", href: "mailto:demo@example.com" },
      ]),
    },
  });

  await prisma.company.createMany({
    data: [
      {
        name: "Northwind Labs (demo)",
        role: "Product designer",
        dateLabel: "2024 — н.в.",
        startYear: 2024,
        ongoing: true,
        description:
          "Placeholder: дизайн платформы аналитики. Данные выдуманы для MVP.",
        logoSrc: "/logos/company-a.svg",
        url: "https://example.com",
        order: 1,
        bloubEmotion: "wave",
        published: true,
      },
      {
        name: "Cedar & Co (demo)",
        role: "UX designer",
        dateLabel: "2022 — 2024",
        startYear: 2022,
        endYear: 2024,
        description:
          "Placeholder: e-commerce и дизайн-система. Не реальный опыт.",
        logoSrc: "/logos/company-b.svg",
        order: 2,
        bloubEmotion: "focus",
        published: true,
      },
      {
        name: "Pixel Harbor (demo)",
        role: "Junior product designer",
        dateLabel: "2020 — 2022",
        startYear: 2020,
        endYear: 2022,
        description: "Placeholder: мобильные сценарии и прототипы.",
        logoSrc: "/logos/company-c.svg",
        order: 3,
        bloubEmotion: "calm",
        published: true,
      },
    ],
  });

  const projects = [
    {
      slug: "aurora-dashboard",
      title: "Aurora Dashboard (demo)",
      dateLabel: "2025",
      createdYear: 2025,
      description: "Кейс-заглушка: дашборд метрик с фокусом на ясность.",
      tags: JSON.stringify(["Product", "Dashboard", "Demo"]),
      logoSrc: "/logos/project-a.svg",
      order: 1,
      bloubEmotion: "spark",
      summary:
        "Демо-кейс. Цель — показать маршрут /projects/[slug] и секции из БД.",
      heroImage: "/cases/aurora-hero.svg",
      sections: [
        {
          heading: "Задача (demo)",
          body: "Случайный бриф: упростить чтение KPI для менеджеров. Это не реальный проект.",
          imageSrc: "/cases/aurora-1.svg",
          sortOrder: 1,
        },
        {
          heading: "Решение (demo)",
          body: "Иерархия карточек, спокойная палитра, понятные состояния пустых данных.",
          imageSrc: "/cases/aurora-2.svg",
          sortOrder: 2,
        },
      ],
    },
    {
      slug: "harbor-checkout",
      title: "Harbor Checkout (demo)",
      dateLabel: "2024",
      createdYear: 2024,
      description: "Кейс-заглушка: сокращение шагов оплаты.",
      tags: JSON.stringify(["UX", "Commerce", "Demo"]),
      logoSrc: "/logos/project-b.svg",
      order: 2,
      bloubEmotion: "focus",
      summary: "Placeholder checkout flow — вымышленный кейс для roadmap.",
      heroImage: "/cases/harbor-hero.svg",
      sections: [
        {
          heading: "Контекст (demo)",
          body: "Вымышленный ритейлер. Нужно уменьшить трение на мобильном checkout.",
          sortOrder: 1,
        },
        {
          heading: "Итог (demo)",
          body: "В демо нет метрик — только структура страницы кейса.",
          imageSrc: "/cases/harbor-1.svg",
          sortOrder: 2,
        },
      ],
    },
    {
      slug: "moss-onboarding",
      title: "Moss Onboarding (demo)",
      dateLabel: "2023",
      createdYear: 2023,
      description: "Кейс-заглушка: онбординг B2B SaaS.",
      tags: JSON.stringify(["Onboarding", "SaaS", "Demo"]),
      logoSrc: "/logos/project-c.svg",
      order: 3,
      bloubEmotion: "wave",
      summary: "Ещё один placeholder-кейс для правой колонки roadmap.",
      heroImage: "/cases/moss-hero.svg",
      sections: [
        {
          heading: "Подход (demo)",
          body: "Прогрессивное раскрытие настроек и понятные empty states.",
          imageSrc: "/cases/moss-1.svg",
          sortOrder: 1,
        },
      ],
    },
  ];

  for (const p of projects) {
    const { sections, ...rest } = p;
    await prisma.project.create({
      data: {
        ...rest,
        published: true,
        sections: { create: sections },
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
