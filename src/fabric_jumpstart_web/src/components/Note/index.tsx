import RenderTextWithLinks from '@components/RenderTextWithLink';
import { useStyles } from './styles';
import { mergeClasses } from '@fluentui/react-components';

interface NoteProps {
  text: string;
  label: string;
  urlMap?: { [key: number]: { url: string } };
  type?: string;
  useDropViewStyles?: boolean;
}

const Note = ({ text, label, urlMap, type, useDropViewStyles }: NoteProps) => {
  const styles = useStyles();
  const isDisclaimer = type === 'disclaimer';
  return (
    <div
      className={mergeClasses(
        styles.wrapper,
        isDisclaimer && styles.disclaimerWrapper,
        useDropViewStyles && styles.dropViewStylesWrapper
      )}
    >
      <p
        className={mergeClasses(
          styles.noteText,
          isDisclaimer && styles.disclaimerText
        )}
      >
        <b className={styles.label}>{label}</b>
        {urlMap ? (
          <RenderTextWithLinks
            text={text}
            urlMap={urlMap}
            className="previewNoteLinks"
          />
        ) : (
          text
        )}
      </p>
    </div>
  );
};

export default Note;
