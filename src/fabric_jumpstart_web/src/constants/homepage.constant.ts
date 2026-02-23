import { INTERNAL_ROUTE } from '@config/urlconfig';
import HomeBanner from '@images/heroBanner.svg';
import Scenarios from '@images/scenarios.svg';
import OurMission from '@images/ourMission.svg';
import PowerAndSecurity from '@images/powerAndSecurity.svg';

export const bannerConst = {
  image: HomeBanner,
};

export const jumpstartUniverseConst = {
  cards: [
    {
      id: 'scenarios',
      image: Scenarios,
      link: INTERNAL_ROUTE.SCENARIOS,
    },
  ],
};

export const sectionCardsConst = [
  {
    id: 'ourMission',
    image: OurMission,
  },
  {
    id: 'powerAndSecurity',
    image: PowerAndSecurity,
  },
];
