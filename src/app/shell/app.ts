import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { GcaConfirmDialog, GcaToast } from 'gca';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, GcaToast, GcaConfirmDialog],
  template: `
    <router-outlet />
    <gca-toast />
    <gca-confirm-dialog />
  `,
})
export class App {}
