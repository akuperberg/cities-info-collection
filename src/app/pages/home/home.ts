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

  // Test method for city details - you can call this from browser console
  testBologna() {
    this.apiService.getCityDetails('https://www.travelsafe-abroad.com/italy/bologna/').subscribe({
      next: (response) => {
        console.log('Bologna Details:', response);
        console.log('City:', response.city.name);
        console.log('Safety Index:', response.city.safetyIndex);
        console.log('User Sentiment:', response.city.userSentiment);
        console.log('Description (first 200 chars):', response.city.description?.substring(0, 200));
      },
      error: (error) => {
        console.error('Error fetching Bologna details:', error);
      }
    });
  }
}
