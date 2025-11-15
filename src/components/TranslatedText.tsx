import { useTranslatedText } from '@/hooks/useTranslation';

interface TranslatedTextProps {
  text: string;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
}

export const TranslatedText = ({ text, as: Component = 'span', className }: TranslatedTextProps) => {
  const translatedText = useTranslatedText(text);
  return <Component className={className}>{translatedText}</Component>;
};
