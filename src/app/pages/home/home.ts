import { Component, OnInit, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon'; 
import { MatRadioModule } from '@angular/material/radio';
import { CommonModule } from '@angular/common';
import { SelectedOption } from './consts/consts';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-home',
  imports: [FormsModule, MatButtonModule, MatInputModule, MatFormField, MatLabel, MatIconModule, MatRadioModule, CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home implements OnInit {
  selectedOption: SelectedOption = 'recommend';
  backendStatus = signal<'checking' | 'connected' | 'disconnected'>('checking');
  backendMessage = signal<string>('');

  private apiService = inject(ApiService);

  ngOnInit() {
    this.checkBackendConnection();
  }

  checkBackendConnection() {
    this.backendStatus.set('checking');
    this.apiService.test().subscribe({
      next: (response) => {
        this.backendStatus.set('connected');
        this.backendMessage.set(`Backend connected: ${response.message}`);
      },
      error: (error) => {
        this.backendStatus.set('disconnected');
        this.backendMessage.set('Backend not available. Make sure it\'s running on http://localhost:3000');
        console.error('Backend connection error:', error);
      }
    });
  }
}
