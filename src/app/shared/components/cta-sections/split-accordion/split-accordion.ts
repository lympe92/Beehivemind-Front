import { Component } from '@angular/core';
import {ImageComponent} from "../../ui/image/image";

@Component({
  selector: 'app-split-accordion',
  standalone: true,
    imports: [
        ImageComponent
    ],
  templateUrl: './split-accordion.html',
  styleUrl: './split-accordion.scss',
})
export class SplitAccordionComponent {}
