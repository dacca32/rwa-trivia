import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, FormArray, FormControl } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { Store, select } from '@ngrx/store';

import * as gameplayactions from '../../store/actions';
import * as useractions from '../../../user/store/actions';
import { GameActions, UserActions } from 'shared-library/core/store/actions';
import {
  Category, GameOptions, GameMode, User, PlayerMode, OpponentType
} from 'shared-library/shared/model';
import { Utils, WindowRef } from 'shared-library/core/services';

import { AppState, appState } from '../../../store';
import { NewGame } from './new-game';
@Component({
  selector: 'new-game',
  templateUrl: './new-game.component.html',
  styleUrls: ['./new-game.component.scss']
})
export class NewGameComponent extends NewGame implements OnInit, OnDestroy {
  categoriesObs: Observable<Category[]>;
  categories: Category[];
  sortedCategories: Category[];
  tagsObs: Observable<string[]>;
  tags: string[];

  selectedTags: string[];
  subs: Subscription[] = [];
  selectedCategories = [];

  newGameForm: FormGroup;
  gameOptions: GameOptions;

  showUncheckedCategories: boolean = false;
  allCategoriesSelected: boolean = true;

  noFriendsStatus: boolean;
  filteredTags$: Observable<string[]>;

  friendUserId: string;
  loaderStatus = false;
  errMsg: string;

  get categoriesFA(): FormArray {
    return this.newGameForm.get('categoriesFA') as FormArray;
  }
  constructor(private fb: FormBuilder,
    public store: Store<AppState>,
    public gameActions: GameActions,
    private windowRef: WindowRef,
    private router: Router,
    public userActions: UserActions,
    public utils: Utils) {
    super(store, utils, gameActions, userActions);

  }

  ngOnInit() {

    this.gameOptions = new GameOptions();
    this.newGameForm = this.createForm(this.gameOptions);

    const playerModeControl = this.newGameForm.get('playerMode');
    playerModeControl.setValue('0');
    const opponentTypeControl = this.newGameForm.get('opponentType');

    playerModeControl.valueChanges.subscribe(v => {
      if (v === '1') {
        opponentTypeControl.enable();
        opponentTypeControl.setValue('0');
      } else {
        opponentTypeControl.disable();
        opponentTypeControl.reset();
      }
    });

    /*
    this.categoriesFA.valueChanges.subscribe(v => {
      //console.log(v);
      let categoryValues: any[] = v;
      if (categoryValues.find(c => (!c.categorySelected && !c.requiredForGamePlay)))
        this.allCategoriesSelected = false;
      else {
        this.allCategoriesSelected = true;
      }
    });
    */

    this.filteredTags$ = this.newGameForm.get('tagControl').valueChanges
      .pipe(map(val => val.length > 0 ? this.filter(val) : []));
  }

  autoOptionClick(event) {
    // Auto complete doesn't seem to have an event on selection of an entry
    // tap into the change event of the input box and if the tag matches any entry in the tag list, then add to the selected tag list
    // else wait for the user to click "Add" if they still want to add tags that are not on the list

    const tag: string = event.srcElement.value;
    const found = this.tags.find(t => t.toLowerCase() === tag.toLowerCase());

    if (found) {
      this.addTagToSelectedList(found);
      this.newGameForm.get('tagControl').setValue('');
    }
  }
  addTagToSelectedList(tag: string) {
    if (tag && tag !== '') {
      this.selectedTags.push(tag);
    }
  }


  toggleShowUncheckedCategories() {
    this.showUncheckedCategories = true;
  }
  addTag() {
    const tagControl = this.newGameForm.get('tagControl');
    this.addTagToSelectedList(tagControl.value);
    tagControl.setValue('');
  }

  createForm(gameOptions: GameOptions) {

    const sortedCategories = [...this.categories.filter(c => c.requiredForGamePlay),
    ...this.categories.filter(c => !c.requiredForGamePlay)];

    this.sortedCategories = sortedCategories;

    sortedCategories.map(category => {
      this.selectedCategories.push(category.id);
    });


    let fcs: FormControl[] = gameOptions.tags.map(tag => {
      const fc = new FormControl(tag);
      return fc;
    });
    if (fcs.length == 0) {
      fcs = [new FormControl('')];
    }

    const tagsFA = new FormArray(fcs);

    const form: FormGroup = this.fb.group({
      playerMode: [gameOptions.playerMode, Validators.required],
      opponentType: [gameOptions.opponentType],
      gameMode: [gameOptions.gameMode, Validators.required],
      tagControl: '',
      tagsArray: tagsFA
    } //, {validator: questionFormValidator}
    );
    return form;
  }


  selectFriendId(friendId: string) {
    this.friendUserId = friendId;
    this.errMsg = undefined;
  }

  selectCategory(event: any, categoryId: number): void {
    if (event.checked) {
      this.selectedCategories.push(categoryId);
    } else {
      this.selectedCategories.splice(this.selectedCategories.indexOf(categoryId), 1);
    }
  }

  onSubmit() {
    // validations
    this.newGameForm.updateValueAndValidity();
    if (this.newGameForm.invalid) {
      return;
    }

    this.loaderStatus = true;

    const gameOptions: GameOptions = this.getGameOptionsFromFormValue(this.newGameForm.value);

    if (Number(gameOptions.playerMode) === PlayerMode.Opponent && Number(gameOptions.opponentType) === OpponentType.Friend
      && !this.friendUserId) {
      if (!this.friendUserId) {
        this.errMsg = 'Please Select Friend';
      }
      this.loaderStatus = false;
      if (this.windowRef && this.windowRef.nativeWindow && this.windowRef.nativeWindow.scrollTo) {
        this.windowRef.nativeWindow.scrollTo(0, 0);
      }
      return;
    }

    this.startNewGame(gameOptions);
  }


  getGameOptionsFromFormValue(formValue: any): GameOptions {
    let gameOptions: GameOptions;

    gameOptions = new GameOptions();
    gameOptions.playerMode = formValue.playerMode;
    gameOptions.opponentType = (formValue.opponentType) ? formValue.opponentType : null;
    gameOptions.categoryIds = this.selectedCategories;
    gameOptions.gameMode = GameMode.Normal;
    gameOptions.tags = this.selectedTags;

    return gameOptions;
  }


  ngOnDestroy() {
    this.utils.unsubscribe(this.subs);
  }
}
