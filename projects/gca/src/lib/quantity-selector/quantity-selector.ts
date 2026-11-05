import { AsyncPipe } from '@angular/common';
import { Component, Input, Output, EventEmitter, input, output, signal, linkedSignal, effect, model, Host, HostListener } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Component({
  imports: [AsyncPipe],
  selector: 'gca-quantity-selector',
  styleUrls: ['./quantity-selector.css'],
  templateUrl: './quantity-selector.html',
  host: {
    '(window:keydown.alt.+)': 'increment()',
    '(window:keydown.alt.-)': 'decrement()',
    '[style.color]': 'quantity() > 0 ? "lightgreen" : "lightcoral" '
  }
})
export class QuantitySelector {

  quantity = model(0);

  // @HostListener('window:keydown.alt.+')
  increment() {
    this.quantity.update(prev => prev + 1);
  }

  decrement() {
    this.quantity.update(prev => prev - 1);
  }
}

/* export class QuantitySelectorSignal {

  quantity = input<number>(0);

  quantityChange = output<number>();

  //quantitySignal = signal<number>(this.quantity()); 
  quantitySignal = linkedSignal(() => this.quantity());

  qfn = effect(() => {
    this.quantityChange.emit(this.quantitySignal());
  });

  increment() {
    this.quantitySignal.update(prev => prev + 1);
  }

  decrement() {
    this.quantitySignal.update(prev => prev - 1);
  }
} */


/* export class QuantitySelectorLegacy {

  @Input()
  set quantity(value: number) {
    this.quantity$.next(value);
  }

  @Output() quantityChange = new EventEmitter<number>();

  quantity$ = new BehaviorSubject(0);

  increment() {
    this.quantity$.next(this.quantity$.value + 1);
    this.quantityChange.emit(this.quantity$.value)
  }

  decrement() {
    this.quantity$.next(this.quantity$.value - 1);
    this.quantityChange.emit(this.quantity$.value)
  }
}
 */
