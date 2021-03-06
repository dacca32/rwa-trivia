import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { GameQuestion } from './game-question';
@Component({
  selector: 'game-question',
  templateUrl: './game-question.component.html',
  styleUrls: ['./game-question.component.scss']
})
export class GameQuestionComponent extends GameQuestion implements OnInit, OnDestroy, AfterViewInit {

  @ViewChild('overlay') overlay: ElementRef;
  @ViewChild('loader') loader: ElementRef;

  constructor() {
    super();
  }

  ngOnInit() {
  }

  ngOnDestroy() {
  }

  ngAfterViewInit() {
    const seconds = 30;
    const loader = this.loader.nativeElement, α = 0;

    this.draw(α, this.doPlay, loader);
  }

  draw(α, doPlay, loader) {
    α++;
    α %= 360;
    let r = (α * Math.PI / 180)
      , x = Math.sin(r) * 125
      , y = Math.cos(r) * -125
      , mid = (α > 180) ? 1 : 1
      , anim = 'M 1 1 v -125 A 125 125 1 '
        + mid + ' 1 '
        + x + ' '
        + y + ' z';


    if (this.doPlay) {
      loader.setAttribute('d', anim);
      setTimeout(() => {
        this.draw(α, this.doPlay, loader);
      }, 44); // Redraw
    }
  }


  fillTimer() {
    this.loader.nativeElement.setAttribute('d', 'M 1 1 v -125 A 125 125 1 1 1 0 -125 z');
  }
}
