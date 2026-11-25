import { motion } from 'motion/react';
import { LiquidButton } from './ui/liquid-glass-button.tsx';

interface ZeroWasteSectionProps {
  onApplyPreset: (ingredients: string[]) => void;
}

const RESCUE_GUIDES = [
  {
    title: 'Day-Old Steamed Rice',
    targetDish: 'Elumichai Sadam & Thayir Sadam',
    description:
      'Chilled leftover rice grains actually stay firmer and separate cleanly when tossed with gingelly oil, mustard tempering, and lemon or curd.',
    ingredients: ['Cooked Rice', 'Lemon', 'Mustard Seeds', 'Curry Leaves', 'Turmeric Powder', 'Gingelly Oil'],
    cardTone: 'bg-[#F5EED8] border-[#D8C798] hover:border-[#A16207]',
    kickerTone: 'text-[#854D0E]',
  },
  {
    title: 'Overripe Tomatoes',
    targetDish: 'Milagu Poondu Rasam & Thakkali Sadam',
    description:
      'Soft or bruised tomatoes release sweeter pulp faster in tamarind broths and tomato rice without needing extra water or thickeners.',
    ingredients: ['Tomato', 'Tamarind', 'Garlic', 'Black Peppercorns', 'Cumin Seeds', 'Curry Leaves'],
    cardTone: 'bg-[#F3E6E2] border-[#D8B9AF] hover:border-[#9A3412]',
    kickerTone: 'text-[#9A3412]',
  },
  {
    title: 'Turning-Sour Curd',
    targetDish: 'Vellai Poosanikai Mor Kuzhambu',
    description:
      'Traditional Thanjavur kitchens turn slightly tangy buttermilk into aromatic Mor Kuzhambu simmered gently with coconut, cumin, and curry leaves.',
    ingredients: ['Curd', 'Grated Coconut', 'Cumin Seeds', 'Green Chilli', 'Turmeric Powder', 'Mustard Seeds'],
    cardTone: 'bg-[#E5ECE3] border-[#B9CBB3] hover:border-[#166534]',
    kickerTone: 'text-[#166534]',
  },
];

export function ZeroWasteSection({ onApplyPreset }: ZeroWasteSectionProps) {
  return (
    <section
      id="zero-waste"
      className="bg-[#DFD9C9] border border-[#C8C0AE] rounded-lg p-6 sm:p-8 space-y-6"
    >
      <div className="space-y-1.5 max-w-2xl">
        <p className="text-xs font-semibold text-[#166534]">
          Traditional Pantry Preservation
        </p>
        <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#1E1E1E]">
          Zero-Waste Tamil Kitchen Pairings
        </h2>
        <p className="text-sm text-[#4A463F] leading-relaxed">
          Traditional Tamil Nadu cooking evolved around preserving every ingredient. Load a
          common leftover staple below to see matching zero-waste recipes immediately.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {RESCUE_GUIDES.map((guide, index) => (
          <motion.div
            key={guide.title}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{
              duration: 0.28,
              delay: index * 0.06,
              ease: [0.16, 1, 0.3, 1],
            }}
            whileHover={{ y: -3 }}
            className={`border rounded-lg p-6 flex flex-col justify-between gap-5 transition-colors ${guide.cardTone}`}
          >
            <div className="space-y-2">
              <div className={`text-xs font-semibold ${guide.kickerTone}`}>{guide.targetDish}</div>
              <h3 className="font-display text-lg font-semibold text-[#1E1E1E]">
                {guide.title}
              </h3>
              <p className="text-sm text-[#4A463F] leading-relaxed">{guide.description}</p>
            </div>

            <LiquidButton
              type="button"
              variant="dark"
              size="sm"
              className="self-start"
              onClick={() => onApplyPreset(guide.ingredients)}
            >
              Load Pantry Items
            </LiquidButton>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
