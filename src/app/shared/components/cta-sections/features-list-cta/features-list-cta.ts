import { Component } from '@angular/core';
import { ImageComponent } from '../../ui/image/image';

interface FeatureItem {
  img: { src: string; alt: string; width: number; height: number };
  title: string;
  description: string;
}

@Component({
  selector: 'app-features-list-cta',
  standalone: true,
  imports: [ImageComponent],
  templateUrl: './features-list-cta.html',
  styleUrl: './features-list-cta.scss',
})
export class FeaturesListCtaComponent {
  items: FeatureItem[] = [
    {
      img: { src: 'assets/img/logotr.webp', alt: 'Inspection date', width: 105, height: 105 },
      title: "Inspection's date",
      description: "Note the right date that you inspected your apiaries and explore their growth in a long run. After some inspections a complete graph will be available for you.",
    },
    {
      img: { src: 'assets/img/logotr.webp', alt: 'Closed brood and eggs', width: 105, height: 105 },
      title: 'Closed brood & eggs',
      description: 'Use the variables closed brood and eggs separately and gain the advantage of being able to predict the development of the hive in the near future.',
    },
    {
      img: { src: 'assets/img/logotr.webp', alt: 'Pollen and honey', width: 105, height: 105 },
      title: 'Pollen & honey',
      description: 'Mention the amounts of pollen and honey you find during the inspections. In this way you will easily find the apiaries or hives which need help or those ready for harvest.',
    },
    {
      img: { src: 'assets/img/logotr.webp', alt: 'Frames and population', width: 105, height: 105 },
      title: 'Frames & Population',
      description: 'By using the variables frames and population right, you can be any time aware as to whether your hives need frame addition or removal.',
    },
    {
      img: { src: 'assets/img/logotr.webp', alt: 'Diseases', width: 105, height: 105 },
      title: 'Diseases',
      description: 'Keep notes on the diseases you find in each hive and get rid of them immediately by using the genetic material you have at your disposal.',
    },
    {
      img: { src: 'assets/img/logotr.webp', alt: 'Info about queen', width: 105, height: 105 },
      title: 'Info about queen',
      description: 'Every time you see the queen give the right voice command and you will be able to know when was the last time that the hive was prosperous.',
    },
  ];
}
