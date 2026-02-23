import React from 'react';
import IconButton from '@components/IconButton';
import {
  ThumbLikeRegular,
  ThumbLikeFilled,
  PenFilled,
  PenRegular,
  AddSquareRegular,
  AddSquareFilled,
  BugRegular,
  BugFilled,
} from '@fluentui/react-icons';
import { useStyles } from './styles';

export interface editPageInterface {
  label: string;
  link?: string;
}
export interface addChildInterface {
  label: string;
  link?: string;
}
export interface bugInterface {
  label: string;
  link?: string;
}
export interface feedbackInterface {
  label: string;
  link?: string;
}

export interface IconContainerProps {
  editPage: editPageInterface;
  addChild: addChildInterface;
  bug: bugInterface;
  feedback: feedbackInterface;
}

const MdIconContainer = ({
  editPage,
  addChild,
  bug,
  feedback,
}: IconContainerProps) => {
  const styles = useStyles();
  const onIconButtonClick = (url: string = '') => {
    url && window.open(url, '_blank');
  };
  return (
    <>
      <div className={styles.iconContainer}>
        <IconButton
          label={editPage.label}
          regularIcon={<PenRegular />}
          filledIcon={<PenFilled />}
          onIconClick={() => onIconButtonClick(editPage.link)}
        />
        <IconButton
          label={addChild.label}
          regularIcon={<AddSquareRegular />}
          filledIcon={<AddSquareFilled />}
          onIconClick={() => onIconButtonClick(addChild.link)}
        />
        <IconButton
          label={bug.label}
          regularIcon={<BugRegular />}
          filledIcon={<BugFilled />}
          onIconClick={() => onIconButtonClick(bug.link)}
        />
      </div>
      <div className={styles.iconContainer}>
        <IconButton
          showLabel
          label={feedback.label}
          regularIcon={<ThumbLikeRegular />}
          filledIcon={<ThumbLikeFilled />}
          onIconClick={() => onIconButtonClick(feedback.link)}
        />
      </div>
    </>
  );
};

export default MdIconContainer;
