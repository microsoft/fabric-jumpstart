import React, { useState, useEffect } from 'react';
import { useStyles } from './styles';

interface DropsImgProps {
  src: string;
  alt: string;
  githubLink: string;
}

const DropsImg: React.FC<DropsImgProps> = ({ src, alt, githubLink }) => {
  const styles = useStyles();
  const [imgIndex, setImgIndex] = useState<number | null>(null);

  const transformSrc = (src: string): string => {
    return src.replace(/<span>&#95;<\/span>/g, '_');
  };
  src = transformSrc(src);
  githubLink = transformSrc(githubLink);
  useEffect(() => {
    if (src.includes('badge')) return;
    if (githubLink === '') return;

    let imageUrl = '';
    let mainImageUrl = '';
    let masterImageUrl = '';

    if (!src.includes('http')) {
      if (src.startsWith('.')) {
        imageUrl = `${githubLink}${src.substring(1)}`;
        mainImageUrl = `${githubLink}/main${src.substring(1)}`;
        masterImageUrl = `${githubLink}/master${src.substring(1)}`;
      } else if (src.startsWith('/')) {
        imageUrl = `${githubLink}${src}`;
        mainImageUrl = `${githubLink}/main${src}`;
        masterImageUrl = `${githubLink}/master${src}`;
      } else {
        imageUrl = `${githubLink}/${src}`;
        mainImageUrl = `${githubLink}/main/${src}`;
        masterImageUrl = `${githubLink}/master/${src}`;
      }

      const urls = [imageUrl, mainImageUrl, masterImageUrl];

      const fetchImages = async () => {
        try {
          const responses = await Promise.all(urls.map((url) => fetch(url)));
          const results = await Promise.all(
            responses.map((response) => response.status === 200)
          );
          setImgIndex(results.indexOf(true));
        } catch (error) {
          console.error(error);
        }
      };

      fetchImages();
    }
  }, [src]);

  const getImageSrc = () => {
    if (src.includes('http')) return src;

    const basePaths = ['', '/main', '/master'];
    const basePath = basePaths[imgIndex ?? -1];

    if (basePath !== undefined) {
      if (src.startsWith('.'))
        return `${githubLink}${basePath}${src.substring(1)}`;
      if (src.startsWith('/')) return `${githubLink}${basePath}${src}`;
      return `${githubLink}${basePath}/${src}`;
    }

    return src;
  };
  return <img src={getImageSrc()} alt={alt} className={styles.dropImg} />;
};

export default DropsImg;
