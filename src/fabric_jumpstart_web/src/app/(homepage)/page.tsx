import PageWrapper from '@components/PageWrapper';
import useTranslation from '@utils/translateWrapper';
import HeroBanner from '@components/HeroBanner';
import ButtonGroup from '@components/ButtonGroup';
import { EXTERNAL_URL, INTERNAL_ROUTE } from '@config/urlconfig';
import ScenarioCarousel from '@components/ScenarioCarousel';
import { bannerConst } from '@constants/homepage.constant';
import ExternalArrowWhite from '@images/externalArrowWhite.svg';
import ExternalArrowBlack from '@images/externalArrowBlack.svg';
import RowSection from './particals/RowSection';
import Icon from '@components/Icon';

export default function Home() {
  const { t } = useTranslation('home');
  return (
    <PageWrapper>
      <HeroBanner
        label={t('banner.label')}
        heading={t('banner.heading')}
        desc={t('banner.desc', { returnObjects: 1 })}
        image={bannerConst.image}
        imageAlt={t('banner.imageAlt')}
        codeSnippet={
          t('banner.codeSnippet', {}, { returnObjects: true }) as any
        }
        pypiLink={EXTERNAL_URL.PYPI}
      >
        <ButtonGroup
          left={{
            label: t('banner.buttonText.left.label'),
            as: 'a',
            href: INTERNAL_ROUTE.SCENARIOS,
          }}
        />
      </HeroBanner>
      <ScenarioCarousel />
      <RowSection />
    </PageWrapper>
  );
}
