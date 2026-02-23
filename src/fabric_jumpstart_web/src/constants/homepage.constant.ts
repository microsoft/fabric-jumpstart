import { EXTERNAL_URL, INTERNAL_ROUTE } from '@config/urlconfig';
import HomeBanner from '@images/heroBanner.svg';
import Scenarios from '@images/scenarios.svg';
import Demos from '@images/demos.svg';
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
    button: {
      left: {
        link: INTERNAL_ROUTE.COMMUNITY,
      },
      right: {
        link: INTERNAL_ROUTE.MISSION,
      },
    },
    image: OurMission,
  },
  {
    id: 'demos',
    link: EXTERNAL_URL.DEMO_FORM,
    image: Demos,
    button: {
      left: {
        icon: true,
        link: EXTERNAL_URL.DEMO,
      },
      right: {
        icon: true,
        link: EXTERNAL_URL.LIGHTNING,
      },
    },
  },
  {
    lid: 'powerAndSecurity',
    button: {
      left: {
        link: INTERNAL_ROUTE.OVERVIEW,
      },
      right: {
        icon: true,
        link: EXTERNAL_URL.LEARN_FABRIC,
      },
    },
    image: PowerAndSecurity,
  },
];
