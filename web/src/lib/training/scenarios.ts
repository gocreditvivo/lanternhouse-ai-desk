import type { LinhTrainingScenario } from './types';

const names = ['Anh Minh', 'Chị Lan', 'David', 'Emily'];
const dates = ['Friday', 'Saturday', 'tomorrow'];
const times = ['6:30 PM', '7:00 PM', '8:15 PM'];

export function buildCoreTrainingScenarios(): LinhTrainingScenario[] {
  const scenarios: LinhTrainingScenario[] = [
    {
      id: 'vi-order-pho-no-onion',
      language: 'vi',
      difficulty: 'easy',
      callerText: 'Cho anh một phở tái không hành, lấy mang về.',
      expectedIntent: 'create_order',
      expectedEntities: { item: 'phở tái', modifier: 'không hành', fulfillment: 'pickup', quantity: 1 },
      requiredTools: ['create_order'],
      allowedTools: ['create_order'],
      requiresConfirmation: true,
      tags: ['food', 'modifier', 'pickup'],
    },
    {
      id: 'mixed-order-switch-language',
      language: 'mixed',
      difficulty: 'medium',
      callerText: 'Can I get two pho tai... actually một tô không hành nha, the other one normal.',
      expectedIntent: 'create_order',
      expectedEntities: { item: 'phở tái', quantity: 2, oneWithoutOnion: true },
      requiredTools: ['create_order'],
      allowedTools: ['create_order'],
      requiresConfirmation: true,
      tags: ['food', 'code-switching', 'correction'],
    },
    {
      id: 'unknown-price-escalation',
      language: 'en',
      difficulty: 'hard',
      callerText: 'How much is the large pho today if your system does not have the price?',
      expectedIntent: 'menu_question',
      allowedTools: [],
      mustEscalate: true,
      requiredResponseIncludes: ['cannot verify'],
      forbiddenResponseClaims: ['$14.99', '$15', 'confirmed price'],
      tags: ['price', 'unknown-data', 'hallucination-guard'],
    },
    {
      id: 'mixed-reservation',
      language: 'mixed',
      difficulty: 'medium',
      callerText: 'Dạ cho chị đặt bàn for four people this Saturday lúc 7 giờ tối.',
      expectedIntent: 'book_appointment',
      expectedEntities: { partySize: 4, date: 'Saturday', time: '7:00 PM' },
      requiredTools: ['book_appointment'],
      allowedTools: ['book_appointment'],
      requiresConfirmation: true,
      tags: ['reservation', 'code-switching'],
    },
  ];

  let n = 0;
  for (const name of names) {
    for (const date of dates) {
      const time = times[n % times.length];
      scenarios.push({
        id: `reservation-variant-${n++}`,
        language: n % 2 === 0 ? 'en' : 'vi',
        difficulty: 'easy',
        callerText:
          n % 2 === 0
            ? `Hi, this is ${name}. I need a table for two on ${date} at ${time}.`
            : `Dạ em đặt bàn cho hai người, tên ${name}, ${date} lúc ${time}.`,
        expectedIntent: 'book_appointment',
        expectedEntities: { customerName: name, partySize: 2, date, time },
        requiredTools: ['book_appointment'],
        allowedTools: ['book_appointment'],
        requiresConfirmation: true,
        tags: ['reservation', 'generated-variant'],
      });
    }
  }

  return scenarios;
}
